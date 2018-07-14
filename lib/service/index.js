'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var app = arguments[1];

  var p = _path2.default.join(__dirname, "../../config/apiclient_cert.p12");
  opts.wechat.pfx = _fs2.default.readFileSync(p);
  var o = {
    Err: Err,
    config: opts,
    payment: new _wechatPay2.default.Payment(opts.wechat)
  };

  o.payment.getBrandWCPayRequestParams = function (order, callback) {
    var self = this;
    var default_params = {};
    if (order.trade_type === 'JSAPI') {
      default_params = {
        appId: this.appId,
        timeStamp: o.payment._generateTimeStamp(),
        nonceStr: o.payment._generateNonceStr(),
        signType: 'MD5'
      };
    } else {
      default_params = {
        appid: this.appId,
        partnerid: this.mchId,
        timestamp: o.payment._generateTimeStamp(),
        noncestr: o.payment._generateNonceStr()
      };
    }

    order = o.payment._extendWithDefault(order, ['notify_url']);

    o.payment.unifiedOrder(order, function (err, data) {
      if (err) {
        return callback(err);
      }

      var opts = {};
      if (order.trade_type === 'JSAPI') {
        opts = {
          package: 'prepay_id=' + data.prepay_id
        };
      } else {
        opts = {
          prepayid: data.prepay_id,
          package: 'Sign=WXPay'
        };
      }

      var params = _lodash2.default.extend(default_params, opts);

      params.sign = self._getSign(params);

      if (order.trade_type === 'NATIVE') {
        params.code_url = data.code_url;
      }

      callback(null, params);
    });
  };

  var bind = function bind(name, uri) {
    uri || (uri = '/' + name);
    ms.client({
      uri: opts.gateway + uri
    }, function (err, doc) {
      !err && doc && (o[name] = doc);
    });
  };

  bind('pay');

  var middleware = _wechatPay2.default.middleware;
  o.middleware = middleware(opts.wechat).getNotify().done(function (message, req, res, next) {
    logger.info('支付成功: %j', message);
    var payCode = message.out_trade_no;
    res.reply('success');
    /**
     * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
     * res.reply(new Error('...'))
     */

    var c = { code: payCode };
    var data = {
      bill: message,
      moditime: Date.now(),
      status: 2

      /**
       * 查询订单，在自己系统里把订单标为已处理
       * 如果订单之前已经处理过了直接返回成功
       */
    };o.pay.get('/pays/', c).then(function (doc) {
      if (doc && doc.rows && doc.rows.length) {
        return doc.rows[0];
      } else {
        logger.warn('无效付款单, 编码: %s', payCode);
        return null;
      }
    }).then(function (doc) {
      if (doc) return o.pay.post('/pays/' + doc._id, data);
      return null;
    }).then(function (doc) {
      if (doc) {
        logger.info('付款单编码 %j 修改为已支付', payCode);
      }
    });
  });

  o.refundMiddleware = middleware(opts.wechat).getRefundNotify().done(function (message, req, res, next) {
    logger.info('退款回调信息: %j', message);
    var payCode = message.out_trade_no;
    res.reply('success');
    /**
     * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
     * res.reply(new Error('...'))
     */

    var c = { code: payCode };
    var data = {
      bill: message,
      moditime: Date.now(),
      status: 1

      /**
       * 查询退单，在自己系统里把退单标为已处理
       * 如果退单之前已经处理过了直接返回成功
       */
    };o.pay.get('/refunds/', c).then(function (doc) {
      if (doc && doc.rows && doc.rows.length) {
        return doc.rows[0];
      } else {
        logger.warn('无效退款单, 编码: %s', payCode);
        return null;
      }
    }).then(function (doc) {
      if (doc) return o.pay.post('/refunds/' + doc._id, data);
      return null;
    }).then(function (doc) {
      if (doc) {
        logger.info('退款单编码 %j 修改为已退款', payCode);
      }
    });
  });

  return o;
};

var _jmMs = require('jm-ms');

var _jmMs2 = _interopRequireDefault(_jmMs);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _wechatPay = require('wechat-pay');

var _wechatPay2 = _interopRequireDefault(_wechatPay);

var _jmErr = require('jm-err');

var _jmErr2 = _interopRequireDefault(_jmErr);

var _consts = require('../consts');

var _consts2 = _interopRequireDefault(_consts);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _jmLog4js2.default.getLogger('jm-pay-wechat');
var ms = (0, _jmMs2.default)();

var Err = _lodash2.default.defaults(_jmErr2.default.Err, _consts2.default.Err);

/**
 * pay-wechat service
 * @param {Object} opts
 * @example
 * opts参数:{
 * }
 * @return {Object} service
 */
module.exports = exports['default'];