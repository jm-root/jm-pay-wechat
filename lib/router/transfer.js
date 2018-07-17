const MS = require('jm-ms-core')
const log = require('jm-log4js')
const error = require('jm-err')

let ms = new MS()
let logger = log.getLogger('jm-pay-wechat')
let Err = error.Err

module.exports = function (service, opts = {}) {
  let pay = function (opts, cb, next) {
    let data = opts.data
    data.channel = opts.params.channel
    service.pay.post('/pays', data, function (err, doc) {
      if (err) return cb(err, doc)
      if (doc.msg) logger.error(doc)
      opts.pay = doc
      next()
    })
  }

  let transfer = function (opts, cb, next) {
    let pay = opts.pay
    let data = opts.data

    data.trade_type || (data.trade_type = 'JSAPI')
    let _opts = {
      partner_trade_no: pay._id, // 商户订单号，需保持唯一性
      openid: data.openid,
      check_name: 'NO_CHECK', // 设置为NO_CHECK时不检查真实姓名
      amount: pay.amount,
      desc: data.memo || '打款',
      spbill_create_ip: opts.ip || '127.0.0.1'
    }

    service.payment
      .transfers(_opts,
        function (err, doc) {
          if (err) {
            logger.error(doc || err)
            if (doc && doc.err_code) {
              doc = {
                err: doc.err_code || Err.FAIL.err,
                msg: doc.err_code_des || err.toString()
              }
            } else {
              doc = {
                err: Err.FAIL.err,
                msg: err.toString()
              }
              logger.error(doc || err)
            }
            service.pay.delete('/pays/' + pay._id)
          } else {
            logger.info('将wechat响应的支付凭据返回前端:' + JSON.stringify(doc))
            let data = {
              bill: doc,
              moditime: Date.now(),
              status: 2
            }
            service.pay.post('/pays/' + pay._id, data)
          }

          doc = doc || {}
          if (!err) {
            doc.id = pay._id;
            doc.code = pay.code;
          }
          cb(null, doc)
        })
  }

  let router = ms.router()
  router
    .add('/', 'post', pay)
    .add('/', 'post', transfer)
  return router
}
