import chai from 'chai'
import config from '../config'
import $ from '../src'

let expect = chai.expect
let service = $(config)
let router = service.router()

let pay = {
  payer: '596d5cb3baeeaf00203de4ec',
  orderId: 'test',
  currency: 'cny',
  amount: 100,
  title: 'test',
  content: 'test'
}

let log = (err, doc) => {
  err && console.error(err.stack)
}

describe('service', function () {
  it('router', function (done) {
    router.post('/prepay/wechat', pay, function (err, doc) {
      expect(doc).to.be.ok
      done()
    })
  })
})
