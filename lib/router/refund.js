const MS = require('jm-ms-core')
const log = require('jm-log4js')

let ms = new MS()
let logger = log.getLogger('jm-pay-wechat')

module.exports = function (service, opts = {}) {
  let Err = service.Err
  let pay = function (opts, cb, next) {
    let data = opts.data
    let id = data.id
    let code = data.code
    let params
    if(id){
      params = {_id: id}
    } else {
      params = {code: code}
    }
    service.pay.get('/pays', params).then(function (doc) {
      if (doc && doc.rows && doc.rows.length) {
        return doc.rows[0]
      } else {
        logger.warn('无效付款单, 编码: %s', code)
        cb(null, Err.FA_INVAILD_BILL)
      }
    }).then(function (doc) {
      service.pay.get('/refunds/', { pay: doc._id }).then(function (ret) {
        if (ret && ret.rows && ret.rows.length) {
          opts.refund = ret.rows[0]
          next()
        } else {
          service.pay.post('/refunds', {
            pay: doc._id,
            amount: doc.amount
          }, function (err, doc) {
            if (err) return cb(err, doc);
            opts.refund = doc;
            next()
          })
        }
      });
    })
  }

  let refund = function (opts, cb, next) {
    let refund = opts.refund
    let data = opts.data

    data.trade_type || (data.trade_type = 'JSAPI')
    let _opts = {
      out_trade_no: refund.pay,
      out_refund_no: refund._id,
      total_fee: refund.amount,
      refund_fee: refund.amount,
      notify_url: service.config.wechat.refundNotifyUrl
    }

    service.payment
      .refund(_opts,
        function (err, doc) {
          if (err) {
            logger.error(doc)
            if (doc.err_code) {
              doc = {
                err: doc.err_code || Err.FAIL.err,
                msg: doc.err_code_des || err.toString()
              }
            }
            service.pay.delete('/refunds/' + refund._id)
          } else {
            logger.info('将wechat响应退款:' + JSON.stringify(doc))
          }

          doc = doc || {}
          if (!err) {
            doc.id = refund._id;
            doc.code = refund.code;
          }
          cb(null, doc)
        })
  }

  let router = ms.router()
  router
    .add('/', 'post', pay)
    .add('/', 'post', refund)
  return router
}