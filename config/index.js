require('log4js').configure(require('path').join(__dirname, 'log4js.json'))
var config = {
  development: {
    port: 3000,
    lng: 'zh_CN',
    debug: 1,
    gateway: 'http://gateway.mdt.24haowan.com',
    wechat: {
      partnerKey: '2Hw24b1502A0la4PU80fMK394e00a7b5',
      appId: 'wx3f7ae3ad8b85ace5',
      mchId: '1398678502',
      notifyUrl: 'http://api.h5.jamma.cn/pay/wechat/',
      refundNotifyUrl: 'http://api.h5.jamma.cn/pay/wechat/'
    },
    modules: {
      pay: {
        module: process.cwd() + '/lib'
      }
    }
  },
  production: {
    port: 80,
    lng: 'zh_CN',
    gateway: 'http://gateway.app',
    modules: {
      pay: {
        module: process.cwd() + '/lib'
      }
    }
  }
}

var env = process.env.NODE_ENV || 'development'
config = config[env] || config['development']
config.env = env

module.exports = config
