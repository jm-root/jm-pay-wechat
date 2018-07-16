const MS = require('jm-ms-core')
const prepay = require('./prepay')
const refund = require('./refund')
const transfer = require('./transfer')

let ms = new MS()
module.exports = function (opts = {}) {
  let service = this

  let router = ms.router()
  router
    .use('/prepay/:channel', prepay(service, opts))
    .use('/refund/:channel', refund(service, opts))
    .use('/transfer/:channel', transfer(service, opts))

  return router
}
