'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var pay = function pay(opts, cb, next) {
    var data = opts.data;
    data.channel = opts.params.channel;
    service.pay.post('/pays', data, function (err, doc) {
      if (err) return cb(err, doc);
      opts.pay = doc;
      next();
    });
  };

  var prepay = function prepay(opts, cb, next) {
    var pay = opts.pay;
    var data = opts.data;

    data.trade_type || (data.trade_type = 'JSAPI');
    var _opts = {
      body: pay.title,
      detail: pay.content,
      total_fee: pay.amount,
      trade_type: data.trade_type,
      openid: data.openid,
      spbill_create_ip: opts.ip || '127.0.0.1',
      out_trade_no: pay._id,
      attach: pay.memo
    };

    service.payment.getBrandWCPayRequestParams(_opts, function (err, doc) {
      if (err) {
        doc = {
          err: Err.FAIL.err,
          msg: err.message || err.toString()
        };
        err = new Error(err);
        logger.error(err);
        service.pay.delete('/pays/' + pay._id).then(function (doc) {});
      } else {
        logger.info('将wechat响应的支付凭据返回前端:' + JSON.stringify(doc));
      }

      doc = doc || {};
      doc.id = pay._id;
      doc.code = pay.code;
      cb(null, doc);
    });
  };

  var router = ms.router();
  router.add('/', 'post', pay).add('/', 'post', prepay);
  return router;
};

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _jmErr = require('jm-err');

var _jmErr2 = _interopRequireDefault(_jmErr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();
var logger = _jmLog4js2.default.getLogger('jm-pay-wechat');
var Err = _jmErr2.default.Err;

module.exports = exports['default'];