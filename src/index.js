import service from './service'
import router from './router'

export default function (opts = {}) {
  ['appId', 'mchId', 'notify_url']
    .forEach(function (key) {
      process.env[key] && (opts.wechat[key] = process.env[key])
    })

  let config = this.config
  config.channels || (config.channels = [])
  config.channels.push('wechat')

  let o = service(opts)
  o.router = router

  var self = this
  this.on('open', function () {
    if (self.servers.http.middle) {
      self.servers.http.middle.use('/pay/wechat/pay.notify', o.middleware)
    }
  })

  return o
}
