'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  ['partnerKey', 'appId', 'mchId', 'notifyUrl'].forEach(function (key) {
    opts.wechat || (opts.wechat = {});
    process.env[key] && (opts.wechat[key] = process.env[key]);
  });

  var config = this.config;
  config.channels || (config.channels = []);
  config.channels.push('wechat');

  var o = (0, _service2.default)(opts, this);
  o.router = _router2.default;

  var self = this;
  this.on('open', function () {
    self.servers.http.middle.use('/pay/wechat/pay.notify', o.middleware);
  });

  return o;
};

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];