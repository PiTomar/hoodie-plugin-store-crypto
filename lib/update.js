'use strict'

var Promise = require('lie')
var PouchDBErrors = require('pouchdb-errors')

var decryptOne = require('./helpers/decrypt-one')
var find = require('./find')
var updateValues = require('./utils/update-values')
var updateObject = require('./utils/update-object')
var lockDocs = require('./utils/doc-lock')

module.exports = update

/**
 * updates and encrypts existing object.
 *
 * @param  {Object}                   store         instance of a hoodie client store
 * @param  {Object}                   state         crypto config
 * @param  {String}                   prefix        optional id prefix
 * @param  {String|Object|Object[]}   objectsOrIds  id or object (or array of objects) with `._id` property
 * @param  {Object|Function}          [change]      Changed properties or function
 *                                                  that changes existing object
 * @return {Promise}
 */
function update (store, state, prefix, objectsOrIds, change) {
  var isMany = Array.isArray(objectsOrIds)
  var key = state.key

  if (key == null || key.length < 32) {
    return Promise.reject(PouchDBErrors.UNAUTHORIZED)
  }

  var locked = lockDocs(prefix, objectsOrIds)

  return find(store, state, prefix, objectsOrIds)

    .catch(function (err) {
      var parentState = Object.getPrototypeOf(state)
      if (Object.getPrototypeOf(parentState) == null) { // it is root
        throw err
      }

      return find(store, parentState, prefix, objectsOrIds)
    })

    .then(function (oldObjects) {
      return isMany
        ? updateMany(store, state, objectsOrIds, oldObjects, change)
        : updateOne(store, state, objectsOrIds, oldObjects, change)
    })

    .then(
      function (arg) {
        locked.unlock()
        return arg
      },
      function (err) {
        locked.unlock()
        throw err
      }
    )
}

function updateOne (store, state, objectOrId, oldObject, change) {
  return updateObject(objectOrId, oldObject, change, state, false)

    .then(function (updatedObject) {
      return store.update(updatedObject._id, function update (object) {
        updateValues(object, updatedObject)
      })
    })

    .then(function (updated) {
      return decryptOne(state.key, updated)
    })
}

function updateMany (store, state, objectsOrIds, oldObjects, change) {
  var mapped = oldObjects.map(function (old, index) {
    if (old instanceof Error) return old

    return updateObject(objectsOrIds[index], old, change, state, false)

      .then(function (updated) {
        if (updated instanceof Error) return updated

        return store.update(updated._id, function updater (object) {
          updateValues(object, updated)
        })

          .then(decryptOne.bind(null, state.key))
      })
  })

  return Promise.all(mapped)
}
