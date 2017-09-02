import error from 'jm-err'
import log from 'jm-log4js'
import MS from 'jm-ms-core'
import prepay from './prepay'

let ms = new MS()
let Err = error.Err
export default function (opts = {}) {
  let service = this
  let t = function (doc, lng) {
    if (doc && lng && doc.err && doc.msg) {
      return {
        err: doc.err,
        msg: service.t(doc.msg, lng) || Err.t(doc.msg, lng) || doc.msg
      }
    }
    return doc
  }

  let router = ms.router()
  router
    .use('/prepay', prepay(service, opts))
  return router
};
