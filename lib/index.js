const service = require('./service')
const router = require('./router')

module.exports = function (opts = {}) {
  let keys = ['gateway']
  keys.forEach(function (key) {
    process.env[key] && (opts[key] = process.env[key])
  })
  keys = ['partnerKey', 'appId', 'mchId', 'notifyUrl', 'refundNotifyUrl']
  keys.forEach(function (key) {
    opts.wechat || (opts.wechat = {})
    process.env[key] && (opts.wechat[key] = process.env[key])
  })

  let o = service(opts, this)
  o.router = router

  let self = this
  if (self) {
    this.on('open', function () {
      self.servers.http.middle.use('/pay/wechat/pay.notify', o.middleware)
      self.servers.http.middle.use('/pay/wechat/pay.refundnotify', o.refundMiddleware)
    })
  }

  return o
}
