const fs = require('fs');

class Auth {
  constructor(type, pemFile) {
    this.type = type;
    this.pemFile = pemFile;
  }

  existsPemFile(cb) {
    if (this.type === Auth.PEM) {
      fs.exists(this.pemFile, (exists) => {
        if (exists) {
          cb(true);
        } else {
          cb(false);
        }
      });
    } else {
      cb(true);
    }
  }

  toString() {
    return this.type;
  }
}

Auth.PASSWORD = 'password';
Auth.PEM = 'pem';

module.exports = Auth;
