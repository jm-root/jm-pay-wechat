'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var service = this;

  var router = ms.router();
  router.use('/prepay/:channel', (0, _prepay2.default)(service, opts)).use('/refund/:channel', (0, _refund2.default)(service, opts));
  return router;
};

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

var _prepay = require('./prepay');

var _prepay2 = _interopRequireDefault(_prepay);

var _refund = require('./refund');

var _refund2 = _interopRequireDefault(_refund);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = new _jmMsCore2.default();
module.exports = exports['default'];