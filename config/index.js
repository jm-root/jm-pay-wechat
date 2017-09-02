require('log4js').configure(require('path').join(__dirname, 'log4js.json'))
var config = {
  development: {
    port: 3000,
    lng: 'zh_CN',
    wechat: {
      partnerKey: '599e70a42ed9ec26d4d6abd6d4d6abd6',
      appId: 'wxaea7c6a9079108c1',
      mchId: '1487871012',
      notifyUrl: 'http://api.mx.jamma.cn/pay/wechat/'
    },
    modules: {
      'pay': {
        module: 'jm-pay'
      },
      'pay-wechat': {
        prefix: '/pay',
        module: process.cwd() + '/lib'
      }
    }
  },
  production: {
    port: 3000,
    lng: 'zh_CN',
    modules: {
      'pay': {
        module: 'jm-pay'
      },
      'pay-wechat': {
        prefix: '/pay',
        module: process.cwd() + '/lib'
      }
    }
  }
}

var env = process.env.NODE_ENV || 'development'
config = config[env] || config['development']
config.env = env

module.exports = config
