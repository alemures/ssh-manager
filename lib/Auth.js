'use strict';

function Auth(type, pemFile) {
  this.type = type;
  this.pemFile = pemFile;
}

Auth.PASSWORD = 'password';
Auth.PEM = 'pem';

Auth.prototype.toString = function() {
  return this.type;
};

module.exports = Auth;
