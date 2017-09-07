import MS from 'jm-ms'
import log from 'jm-log4js'
import wechatPay from 'wechat-pay'
import t from '../locale'

let logger = log.getLogger('jm-pay')
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

  let middleware = wechatPay.middleware
  o.middleware = middleware(opts.wechat)
    .getNotify()
    .done(function (message, req, res, next) {
      let pay = app.modules.pay.pay
      logger.info('支付成功: %j', message)
      let openid = message.openid
      let payCode = message.out_trade_no
      let attach = {}
      try {
        attach = JSON.parse(message.attach)
      } catch (e) {
      }

      /**
       * 查询订单，在自己系统里把订单标为已处理
       * 如果订单之前已经处理过了直接返回成功
       */
      res.reply('success')

      /**
       * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
       * res.reply(new Error('...'))
       */

      let c = {code: payCode}
      let options = {
        moditime: Date.now(),
        status: 1
      }

      pay.update(c, options)
        .then(function () {
          logger.info('%j 修改为已支付', payCode)
        })
    })

  return o
}
