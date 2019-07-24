var test = require('tape')
var Store = require('@hoodie/store-client')

var cryptoStore = require('../../')

var PouchDB = require('../utils/pouchdb.js')
var uniqueName = require('../utils/unique-name')

test('cryptoStore should listen to account/signout events', function (t) {
  t.plan(3)

  var name = uniqueName()
  var hoodie = {
    account: null,
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  hoodie.account = {
    on: function (eventName, handler) {
      t.equal(eventName, 'signout', 'eventName is signout')
      t.equal(typeof handler, 'function', 'handler is a function')
      t.equal(handler, hoodie.cryptoStore.lock, 'handler is cryptoStore.lock')
    }
  }

  try {
    cryptoStore(hoodie)
  } catch (err) {
    t.end(err)
  }
})

test('cryptoStore should work with a not complete Hoodie-client', function (t) {
  t.plan(1)

  var name = uniqueName()

  var hoodie = {
    // no account
    store: new Store(name, {
      PouchDB: PouchDB,
      remote: 'remote-' + name
    })
  }

  try {
    cryptoStore(hoodie)

    t.ok(hoodie.cryptoStore, 'cryptoStore exists')
  } catch (err) {
    t.end(err)
  }
})