'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var app = arguments[1];

  var o = {
    payment: new _wechatPay2.default.Payment(opts.wechat)
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
    var openid = message.openid;
    var payCode = message.out_trade_no;
    var attach = {};
    try {
      attach = JSON.parse(message.attach);
    } catch (e) {}

    res.reply('success');

    /**
     * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
     * res.reply(new Error('...'))
     */

    var c = { code: payCode };
    var data = {
      moditime: Date.now(),
      status: 1

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
      if (!doc) return o.pay.post('/pays/' + doc._id, data);
      return null;
    }).then(function (doc) {
      if (doc) {
        logger.info('付款单编码 %j 修改为已支付', payCode);
      }
    });
  });

  return o;
};

var _jmMs = require('jm-ms');

var _jmMs2 = _interopRequireDefault(_jmMs);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _wechatPay = require('wechat-pay');

var _wechatPay2 = _interopRequireDefault(_wechatPay);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _jmLog4js2.default.getLogger('jm-pay-wechat');
var ms = (0, _jmMs2.default)();

/**
 * pay-wechat service
 * @param {Object} opts
 * @example
 * opts参数:{
 * }
 * @return {Object} service
 */
module.exports = exports['default'];