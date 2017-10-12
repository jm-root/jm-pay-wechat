import MS from 'jm-ms-core'
import log from 'jm-log4js'
import error from 'jm-err'

let ms = new MS()
let logger = log.getLogger('jm-pay-wechat')
let Err = error.Err

export default function (service, opts = {}) {
  let pay = function (opts, cb, next) {
    let data = opts.data
    data.channel = opts.params.channel
    service.pay.post('/pays', data, function (err, doc) {
      if (err) return cb(err, doc)
      opts.pay = doc
      next()
    })
  }

  let prepay = function (opts, cb, next) {
    let pay = opts.pay
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
              err: Err.FAIL.err,
              msg: err.message || err.toString()
            }
            err = new Error(err)
            logger.error(err)
            service.pay
              .delete('/pays/' + pay._id)
              .then(function (doc) {
              })
          } else {
            logger.info('将wechat响应的支付凭据返回前端:' + JSON.stringify(doc))
          }

          cb(null, doc)
        })
  }

  let router = ms.router()
  router
    .add('/', 'post', pay)
    .add('/', 'post', prepay)
  return router
}
