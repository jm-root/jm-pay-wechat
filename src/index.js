import service from './service'
import router from './router'

export default function (opts = {}) {
  ['partnerKey', 'appId', 'mchId', 'notifyUrl']
    .forEach(function (key) {
      opts.wechat || (opts.wechat = {})
      process.env[key] && (opts.wechat[key] = process.env[key])
    })

  let config = this.config
  config.channels || (config.channels = [])
  config.channels.push('wechat')

  let o = service(opts, this)
  o.router = router

  var self = this
  this.on('open', function () {
    self.servers.http.middle.use('/pay/wechat/pay.notify', o.middleware)
  })

  return o
}
