/* eslint-env mocha */
import assert from 'power-assert'
import Router from '../lib/router'
import event from 'synthetic-dom-events'

function once (event) {
  let resolve
  function handle () {
    window.removeEventListener(event, handle, false)
    window.document.removeEventListener(event, handle, false)
    resolve()
  }
  window.addEventListener(event, handle, false)
  window.document.addEventListener(event, handle, false)
  return new Promise(r => resolve = r)
}

function click (node) {
  node.dispatchEvent(event('click', { bubbles: true, cancelable: true }))
}

describe('Router#start', () => {
  it('ignores prevented link clicks', async () => {
    let routing
    let called = 0
    let router = new Router()
      .on('route', (args, promise) => { routing = promise })
      .use('/start', ({ resolve }) => resolve())
      .use('/linked/:to', ({ params, resolve }) => {
        ++called
        assert.fail('should not route due to default prevented')
        resolve()
      })

    history.replaceState(null, document.title, '/start')
    router.start({ routeLinks: true })
    await routing

    let clicking = once('click')
    let link = document.body.appendChild(document.createElement('a'))
    link.href = '/linked/location'
    link.addEventListener('click', evt => evt.preventDefault())
    click(link)
    await clicking
    await routing

    document.body.removeChild(link)
    router.stop()
    assert.equal(called, 0, 'matching route should not be called')
  })

  it('listens to link clicks if routeLinks is true', async () => {
    let routing
    let called = 0
    let router = new Router()
      .on('route', (args, promise) => { routing = promise })
      .use('/start', ({ resolve }) => resolve())
      .use('/linked/:to', ({ params, resolve }) => {
        ++called
        assert.equal(params.to, 'location', 'param to should be set')
        resolve()
      })

    history.replaceState(null, document.title, '/start')
    router.start({ routeLinks: true })
    await routing

    let clicking = once('click')
    let link = document.createElement('a')
    link.href = '/linked/location'
    document.body.appendChild(link)
    click(link)
    await clicking
    await routing

    document.body.removeChild(link)
    router.stop()
    assert.equal(called, 1, 'matching route should be called')
  })
})
