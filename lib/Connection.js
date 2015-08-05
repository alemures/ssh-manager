'use strict';

var spawn = require('child_process').spawn;

var Auth = require('./Auth');

function Connection(server) {
  this.server = server;
  this.timeout = 2500;
}

Connection.prototype.connect = function(cb) {
  var ssh = spawn('ssh', this.createSshParams());

  console.log('Connecting...');

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

Connection.prototype.createSshParams = function() {
  var params = ['-tt', this.server.user + '@' + this.server.host];

  if (this.server.auth.type === Auth.PEM) {
    params.unshift(this.server.auth.pemFile);
    params.unshift('-i');
  }

  return params;
};

module.exports = Connection;
