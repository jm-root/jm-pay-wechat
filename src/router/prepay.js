import _ from 'lodash'
import validator from 'validator'
import error from 'jm-err'
import MS from 'jm-ms-core'
import log from 'jm-log4js'

let ms = new MS()
let Err = error.Err
let logger = log.getLogger('jm-pay')

export default function (service, opts = {}) {
  let t = function (doc, lng) {
    if (doc && lng && doc.err && doc.msg) {
      return {
        err: doc.err,
        msg: service.t(doc.msg, lng) || Err.t(doc.msg, lng) || doc.msg
      }
    }
    return doc
  }

  let prepay = function (opts, cb, next) {
    let pay = opts.pay
    if (!pay) cb(null, Err.FA_SYS)
    let data = opts.data

    data.trade_type || (data.trade_type = 'JSAPI')
    let _opts = {
      body: pay.title,
      detail: pay.content,
      total_fee: pay.amount,
      trade_type: data.trade_type,
      openid: data.openid,
      spbill_create_ip: opts.ip || '127.0.0.1',
      out_trade_no: pay.code,
      attach: pay.memo
    }

    service.payment
      .getBrandWCPayRequestParams(_opts,
        function (err, doc) {
          if (err) {
            doc = {
              err: err.name,
              msg: err.message
            }
            logger.error(err.stack)
          } else {
            logger.info('将wechat响应的支付凭据返回前端:' + JSON.stringify(doc))
          }

          cb(err, doc)
        })
  }

  let router = ms.router()
  router
    .add('/wechat', 'post', prepay)
  return router
};
