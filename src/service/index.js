import MS from 'jm-ms'
import log from 'jm-log4js'
import _ from 'lodash'
import wechatPay from 'wechat-pay'

let logger = log.getLogger('jm-pay-wechat')
let ms = MS()

/**
 * pay-wechat service
 * @param {Object} opts
 * @example
 * opts参数:{
 * }
 * @return {Object} service
 */
export default function (opts = {}, app) {
  let o = {
    payment: new wechatPay.Payment(opts.wechat)
  }

  o.payment.getBrandWCPayRequestParams = function (order, callback) {
    let self = this
    let defaultParams = {
      appid: this.appId,
      partnerid: this.mchId,
      timestamp: o.payment._generateTimeStamp(),
      noncestr: o.payment._generateNonceStr()
    }

    order = o.payment._extendWithDefault(order, [
      'notify_url'
    ])

    o.payment.unifiedOrder(order, function (err, data) {
      if (err) {
        return callback(err)
      }

      let params = _.extend(defaultParams, {
        prepayid: data.prepay_id,
        package: 'Sign=WXPay'
      })

      params.sign = self._getSign(params)

      if (order.trade_type === 'NATIVE') {
        params.code_url = data.code_url
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
      let payCode = message.out_trade_no
      res.reply('success')
      /**
       * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
       * res.reply(new Error('...'))
       */

      let c = {code: payCode}
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
        .get('/pays/', c)
        .then(function (doc) {
          if (doc && doc.rows && doc.rows.length) {
            return doc.rows[0]
          } else {
            logger.warn('无效付款单, 编码: %s', payCode)
            return null
          }
        })
        .then(function (doc) {
          if (doc) return o.pay.post('/pays/' + doc._id, data)
          return null
        })
        .then(function (doc) {
          if (doc) {
            logger.info('付款单编码 %j 修改为已支付', payCode)
          }
        })
    })

  return o
}
