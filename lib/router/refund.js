'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (service) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var Err = service.Err;
  var pay = function pay(opts, cb, next) {
    var data = opts.data;
    var id = data.id;
    var code = data.code;
    var params = void 0;
    if (id) {
      params = { _id: id };
    } else {
      params = { code: code };
    }
    service.pay.get('/pays', params).then(function (doc) {
      if (doc && doc.rows && doc.rows.length) {
        return doc.rows[0];
      } else {
        logger.warn('无效付款单, 编码: %s', code);
        cb(null, Err.FA_INVAILD_BILL);
      }
    }).then(function (doc) {
      service.pay.get('/refunds/', { pay: doc._id }).then(function (ret) {
        if (ret && ret.rows && ret.rows.length) {
          opts.refund = ret.rows[0];
          next();
        } else {
          service.pay.post('/refunds', {
            pay: doc._id,
            amount: doc.amount
          }, function (err, doc) {
            if (err) return cb(err, doc);
            opts.refund = doc;
            next();
          });
        }
      });
    });
  };

  var refund = function refund(opts, cb, next) {
    var refund = opts.refund;
    var data = opts.data;

    data.trade_type || (data.trade_type = 'JSAPI');
    var _opts = {
      out_trade_no: refund.pay,
      out_refund_no: refund._id,
      total_fee: refund.amount,
      refund_fee: refund.amount,
      notify_url: service.config.wechat.refundNotifyUrl
    };

    service.payment.refund(_opts, function (err, doc) {
      if (err) {
        doc = {
          err: Err.FAIL.err,
          msg: err.message || err.toString()
        };
        err = new Error(err);
        logger.error(err);
        service.pay.delete('/refunds/' + refund._id).then(function (doc) {});
      } else {
        logger.info('将wechat响应退款:' + JSON.stringify(doc));
      }

      doc = doc || {};
      if (!err) {
        doc.id = refund._id;
        doc.code = refund.code;
      }
      cb(null, doc);
    });
  };

  var router = ms.router();
  router.add('/', 'post', pay).add('/', 'post', refund);
  return router;
};

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();
var logger = _jmLog4js2.default.getLogger('jm-pay-wechat');

module.exports = exports['default'];