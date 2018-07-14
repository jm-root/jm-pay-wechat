import MS from 'jm-ms-core'
import prepay from './prepay'
import refund from './refund'

let ms = new MS()
export default function (opts = {}) {
  let service = this

  let router = ms.router()
  router
    .use('/prepay/:channel', prepay(service, opts))
    .use('/refund/:channel', refund(service, opts))
  return router
}
