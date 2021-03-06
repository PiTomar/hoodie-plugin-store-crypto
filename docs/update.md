| [index](../README.md) | [API](./api.md) | [about cryptography](./about_cryptography.md) | update | [Contributing](../CONTRIBUTING.md) | [Code of Conduct](../CODE_OF_CONDUCT.md) |
|-----------------------|-----------------|-----------------------------------------------|--------|-----------------------------------|------------------------------------------|

# Update Notes

This document will provide an update path for you.

It will list all changes, you have to make, if you update to:

- [v2](#v2-update-notes)
- [v2.2](#v22-update-notes)
- [v2.3](#v23-update-notes)
- [v3](#v3-update-notes)
- [v4](#v4-update-notes)

## v2 Update Notes

### setPassword

`setPassword` got split into `setup` and `unlock`.

### Fail if not unlocked

All reading and writing methods fail now if this plugin wasn't unlocked!

### Checking the Password

__*v1 didn't check if the entered password was correct!* This version does now!__
It uses an encrypted random string in the `hoodiePluginCryptoStore/salt` doc. Saved in the `check`-field. With the same encryption as the other docs. It will get added/updated with `setup` and `changePassword`.

```JSON
{
  "_id": "hoodiePluginCryptoStore/salt",
  "salt": "bf11fa9bafca73586e103d60898989d4",
  "check": {
    "nonce": "6e9cf8a4a6eee26f19ff8c70",
    "tag": "0d2cfd645fe49b8a29ce22dbbac26b1e",
    "data": "5481cf42b7e3f1d15477ed8f1d938bd9fd6103903be6dd4e146f69d9f124e34f33b7f ... this is 256 chars long ..."
  }
}
```

__It will still unlock, if no password check is present on the salt-doc!__ But it will add a check as soon as the first encrypted doc got read without an error!

This is to ensure backwards compatibility.

__The password check autofix can get deactivated__

To deactivate the password check autofix add the option `noPasswordCheckAutoFix`.


```json
{
  "name": "your-hoodie-app",
  ...
  "hoodie": {
    "plugins": [
      "hoodie-plugin-store-crypto"
    ],
    "app": {
      "hoodie-plugin-store-crypto": {
        "noPasswordCheckAutoFix": true
      }
    }
  }
}
```

```javascript
// Or if you set up your client yourself

var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: '',
  PouchDB: PouchDB
})

cryptoStore(hoodie, { noPasswordCheckAutoFix: true }) // sets up hoodie.cryptoStore
```

Then no password check will get added, until the next password change.

## v2.2 Update Notes

This version adds __password-resetKeys__. Display them to your user. If the user forgets their password, they can
reset their password, using one of the 10 reset keys.

They get generated by:
- `setup`
- `changePassword`
- `resetPassword`

__If the user was already setup, then no reset key will get generated, until the next password change!__

## v2.3 Update Notes

Beginning from v2.3 you can mark document-members to be not encrypted! They will get saved in plain text!

This is useful for example if you wand to put in place a search or document relationship.

To mark a member to be not encrypted list them in `cy_ignore` or `__cy_ignore`. [Read more in the API docs](./api.md#select-fields-that-shouldnt-get-encrypted).

Also to handle future CouchDB and PouchDB updates there is now a new option. If `handleSpecialDocumentMembers` is set to `true` then all members that start with a `_` will not get encrypted! They will get saved in plain text! More in the [API-docs](./api.md#what-gets-encrypted).

Examples to set this option:

```json
{
  "name": "your-hoodie-app",
  ...
  "hoodie": {
    "plugins": [
      "hoodie-plugin-store-crypto"
    ],
    "app": {
      "hoodie-plugin-store-crypto": {
        "handleSpecialDocumentMembers": true
      }
    }
  }
}
```

```javascript
// Or if you set up your client yourself

var Hoodie = require('@hoodie/client')
var PouchDB = require('pouchdb')
var cryptoStore = require('hoodie-plugin-store-crypto')

var hoodie = new Hoodie({ // create an instance of the hoodie-client
  url: '',
  PouchDB: PouchDB
})

cryptoStore(hoodie, { handleSpecialDocumentMembers: true }) // sets up hoodie.cryptoStore
```

[**Version 3 did change handling of special document members!**](#handling-special-document-members-is-now-the-default)

## v3 Update Notes

### Old salt doc

The old salt doc (`_design/cryptoStore/salt`) is now ignored!

If an user still has the old salt doc, then you can move it to `hoodiePluginCryptoStore/salt`.

```javascript
const salt = await hoodie.store.find('_design/cryptoStore/salt')
salt._id = `hoodiePluginCryptoStore/salt`
delete salt._rev
hoodie.store.add(salt)
hoodie.store.remove('_design/cryptoStore/salt')
```

### Salt doc without a password check is deprecated

A future major version will no longer add a missing password check and fail!

Please have your *users change their password* or/and don't set `noPasswordCheckAutoFix` to `true`.

You are all set, if all your users `hoodiePluginCryptoStore/salt` doc contain a `check`-field!

### Dropping of support for node v6

Because Node version 6 is end-of-life, it is now no longer supported!

If you are still using node v6: please migrate to a newer version! Node version 8 will also be end-of-life by the end of this year.

### Handling special document members is now the default

All document members/fields that start with an `_` will now not encrypted.

To deactivate it set the option `notHandleSpecialDocumentMembers` to `true`.

## v4 Update Notes

### Constructor export

The main export (`require('hoodie-plugin-crypto-store')`) is now a constructor. It requires a hoodie-store
and optionally options.

```javascript
const CryptoStore = require('hoodie-plugin-crypto-store')

const cryptoStore = new CryptoStore(hoodie.store, {
  // some options
})
```

The constructor will not listen to `signout` events. If you want to lock the CryptoStore instance,
then you have to manually listen to [hoodie's `signout` event](https://github.com/hoodiehq/hoodie-account-client#events).

```javascript
hoodie.account.on('signout', () => {
  cryptoStore.lock()
})
```

If you use hoodie's plugin system, then nothing will change for you.

### Removing of notHandleSpecialDocumentMembers-option

The `notHandleSpecialDocumentMembers` option got removed with v4.
All fields that start with an "_" will not get encrypted!
