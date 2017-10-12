import MS from 'jm-ms'
import log from 'jm-log4js'
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
      let openid = message.openid
      let payCode = message.out_trade_no
      let attach = {}
      try {
        attach = JSON.parse(message.attach)
      } catch (e) {
      }

      res.reply('success')

      /**
       * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
       * res.reply(new Error('...'))
       */

      let c = {code: payCode}
      let data = {
        moditime: Date.now(),
        status: 1
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
          if (!doc) return o.pay.post('/pays/' + doc._id, data)
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
