'use strict';

var pty = require('node-pty');

var Auth = require('./Auth');

function Connection(server) {
  this.server = server;
  this.timeout = 2500;
}

Connection.prototype.connect = function (cb) {
  console.info('Connecting...');
  var connected = false;

  var ssh = pty.spawn('ssh', this.createSshParams(), {
    cols: process.stdout.columns,
    rows: process.stdout.rows
  });

  ssh.onData(onData);
  ssh.onExit(onExit);
  process.on('SIGINT', ctrlCPressed);
  process.stdout.on('resize', onResize);

  function onData(data) {
    if (!connected) {
      onConnect(data);
      connected = true;
    }

    process.stdout.write(data);
  }

  function onExit(result) {
    process.stdin.setRawMode(false);
    process.stdin.removeListener('data', inputToSsh);
    process.removeListener('SIGINT', ctrlCPressed);
    process.stdout.removeListener('resize', onResize);

    cb(result.exitCode, result.signal);
  }

  function onConnect(data) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', inputToSsh);
  }

  function onResize() {
    ssh.resize(process.stdout.columns, process.stdout.rows);
  }

  function inputToSsh(data) {
    ssh.write(data);
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
