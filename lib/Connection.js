'use strict';

var childPty = require('child_pty');

var Auth = require('./Auth');

function Connection(server) {
  this.server = server;
  this.timeout = 2500;
}

Connection.prototype.connect = function (cb) {
  console.info('Connecting...');

  var ssh = childPty.spawn('ssh', this.createSshParams(), {
    columns: process.stdout.columns,
    rows: process.stdout.rows
  });

  process.stdout.on('resize', function () {
    ssh.stdout.resize({ columns: process.stdout.columns, rows: process.stdout.rows });
  });

  ssh.on('close', onClose);
  ssh.stdout.once('data', onConnect);
  ssh.stdout.on('data', sshToOutput);
  ssh.stderr.on('data', sshToError);
  process.on('SIGINT', ctrlCPressed);

  function onClose(code, signal) {
    process.stdin.setRawMode(false);
    process.stdin.removeListener('data', inputToSsh);
    process.removeListener('SIGINT', ctrlCPressed);

    cb(code, signal);
  }

  function onConnect(data) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', inputToSsh);
  }

  function sshToOutput(data) {
    process.stdout.write(data);
  }

  function sshToError(data) {
    process.stderr.write(data);
  }

  function inputToSsh(data) {
    ssh.stdin.write(data);
  }

  function ctrlCPressed() {
    ssh.kill('SIGINT');
  }
};

Connection.prototype.createSshParams = function () {
  var params = ['-tt', this.server.user + '@' + this.server.host];

  if (this.server.auth.type === Auth.PEM) {
    params.unshift(this.server.auth.pemFile);
    params.unshift('-i');
  }

  return params;
};

module.exports = Connection;
