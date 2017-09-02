'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var t = function t(doc, lng) {
    if (doc && lng && doc.err && doc.msg) {
      return {
        err: doc.err,
        msg: service.t(doc.msg, lng) || Err.t(doc.msg, lng) || doc.msg
      };
    }
    return doc;
  };

  var prepay = function prepay(opts, cb, next) {
    var pay = opts.pay;
    if (!pay) cb(null, Err.FA_SYS);
    var data = opts.data;

    data.trade_type || (data.trade_type = 'JSAPI');
    var _opts = {
      body: pay.title,
      detail: pay.content,
      total_fee: pay.amount,
      trade_type: data.trade_type,
      openid: data.openid,
      spbill_create_ip: opts.ip || '127.0.0.1',
      out_trade_no: pay.code,
      attach: pay.memo
    };

    service.payment.getBrandWCPayRequestParams(_opts, function (err, doc) {
      if (err) {
        doc = {
          err: err.name,
          msg: err.message
        };
        logger.error(err.stack);
      } else {
        logger.info('将wechat响应的支付凭据返回前端:' + JSON.stringify(doc));
      }

      cb(err, doc);
    });
  };

  var router = ms.router();
  router.add('/wechat', 'post', prepay);
  return router;
};

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _jmErr = require('jm-err');

var _jmErr2 = _interopRequireDefault(_jmErr);

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();
var Err = _jmErr2.default.Err;
var logger = _jmLog4js2.default.getLogger('jm-pay');

;
module.exports = exports['default'];