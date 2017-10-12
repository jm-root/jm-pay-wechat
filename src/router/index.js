import MS from 'jm-ms-core'
import prepay from './prepay'

let ms = new MS()
export default function (opts = {}) {
  let service = this

  let router = ms.router()
  router
    .use('/prepay/:channel', prepay(service, opts))
  return router
}
