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
    let code = data.code

    service.pay.get('/pays', {code}).then(function (doc) {
      if (doc && doc.rows && doc.rows.length) {
        opts.pay = doc.rows[0]
        if (opts.pay.amount !== data.amount) { // 价格不一样需重建
          service.pay.delete(`/pays/${opts.pay._id}`).then(function () {
            service.pay.post('/pays', data, function (err, doc) {
              if (err) return cb(err, doc)
              opts.pay = doc
              next()
            })
          })
        } else {
          next()
        }
      } else {
        service.pay.post('/pays', data, function (err, doc) {
          if (err) return cb(err, doc)
          opts.pay = doc
          next()
        })
      }
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
      out_trade_no: pay._id,
      attach: pay.memo
    }

    service.payment
      .getBrandWCPayRequestParams(_opts,
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
          }

          doc = doc || {}
          if (!err) {
            doc.id = pay._id
            doc.code = pay.code
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
