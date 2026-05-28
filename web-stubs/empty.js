'use strict';
// Smart stub: any property access returns a callable no-op so bundled code doesn't crash.
const noop = function() { return noop; };
noop.default = noop;
const handler = {
  get(_t, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return noop;
    return noop;
  },
  apply() { return noop; },
};
module.exports = new Proxy(noop, handler);
