'use strict';

var fs = require('fs');

function Auth(type, pemFile) {
  this.type = type;
  this.pemFile = pemFile;
}

Auth.PASSWORD = 'password';
Auth.PEM = 'pem';

Auth.prototype.existsPemFile = function (cb) {
  if (this.type === Auth.PEM) {
    fs.exists(this.pemFile, function (exists) {
      if (exists) {
        cb(true);
      } else {
        cb(false);
      }
    });
  } else {
    cb(true);
  }
};

Auth.prototype.toString = function () {
  return this.type;
};

module.exports = Auth;
