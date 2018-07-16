const MS = require('jm-ms')
const log = require('jm-log4js')
const _ = require('lodash')
const wechatPay = require('wechat-pay')
const error = require('jm-err')
const consts = require('../consts')
const path = require('path')
const fs = require('fs')

let logger = log.getLogger('jm-pay-wechat')
let ms = MS()

const Err = _.defaults(error.Err, consts.Err)

/**
 * pay-wechat service
 * @param {Object} opts
 * @example
 * opts参数:{
 * }
 * @return {Object} service
 */
module.exports = function (opts = {}, app) {
  let p = path.join(__dirname, "../../config/apiclient_cert.p12")
  opts.wechat.pfx = fs.readFileSync(p)
  let o = {
    Err: Err,
    config: opts,
    payment: new wechatPay.Payment(opts.wechat)
  }

  o.payment.getBrandWCPayRequestParams = function (order, callback) {
    let self = this
    let default_params = {}
    if (order.trade_type === 'JSAPI') {
      default_params = {
        appId: this.appId,
        timeStamp: o.payment._generateTimeStamp(),
        nonceStr: o.payment._generateNonceStr(),
        signType: 'MD5'
      };
    } else {
      default_params = {
        appid: this.appId,
        partnerid: this.mchId,
        timestamp: o.payment._generateTimeStamp(),
        noncestr: o.payment._generateNonceStr()
      }
    }

    order = o.payment._extendWithDefault(order, [
      'notify_url'
    ])

    o.payment.unifiedOrder(order, function (err, data) {
      if (err) {
        return callback(err)
      }

      let opts = {}
      if (order.trade_type === 'JSAPI') {
        opts = {
          package: 'prepay_id=' + data.prepay_id
        }
      } else {
        opts = {
          prepayid: data.prepay_id,
          package: 'Sign=WXPay'
        }
      }

      let params = _.extend(default_params, opts);

      params.sign = self._getSign(params)

      if (order.trade_type === 'NATIVE') {
        params.code_url = data.code_url;
      }

      callback(null, params)

    })
  }

  let bind = function (name, uri) {
    uri || (uri = '/' + name)
    ms.client({
      uri: opts.gateway + uri
    }, function (err, doc) {
      !err && doc && (o[name] = doc)
    })
  }

  bind('pay')

  let middleware = wechatPay.middleware
  o.middleware = middleware(opts.wechat)
    .getNotify()
    .done(function (message, req, res, next) {
      logger.info('支付成功: %j', message)
      let payId = message.out_trade_no
      res.reply('success')
      /**
       * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
       * res.reply(new Error('...'))
       */

      let data = {
        bill: message,
        moditime: Date.now(),
        status: 2
      }

      /**
       * 查询订单，在自己系统里把订单标为已处理
       * 如果订单之前已经处理过了直接返回成功
       */
      o.pay
        .get(`/pays/${payId}`)
        .then(function (doc) {
          if (doc) {
            return doc
          } else {
            logger.warn('无效付款单, 编码: %s', payId)
            return null
          }
        })
        .then(function (doc) {
          if (doc) return o.pay.post('/pays/' + doc._id, data)
          return null
        })
        .then(function (doc) {
          if (doc) {
            logger.info('付款单编码 %j 修改为已支付', payId)
          }
        })
    })

  o.refundMiddleware = middleware(opts.wechat)
    .getRefundNotify()
    .done(function (message, req, res, next) {
      logger.info('退款回调信息: %j', message)
      let payId = message.out_trade_no
      res.reply('success')
      /**
       * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
       * res.reply(new Error('...'))
       */

      let data = {
        bill: message,
        moditime: Date.now(),
        status: 1
      }

      /**
       * 查询退单，在自己系统里把退单标为已处理
       * 如果退单之前已经处理过了直接返回成功
       */
      o.pay
        .get(`/refunds/${payId}`)
        .then(function (doc) {
          if (doc) {
            return doc
          } else {
            logger.warn('无效退款单, 编码: %s', payId)
            return null
          }
        })
        .then(function (doc) {
          if (doc){
            o.pay.post('/pays/' + doc.pay, {status: 3}).then(function(){
              return o.pay.post('/refunds/' + doc._id, data)
            })
          } else {
            return null
          }
        })
        .then(function (doc) {
          if (doc) {
            logger.info('退款单编码 %j 修改为已退款', payId)
          }
        })
    })

  return o
}
