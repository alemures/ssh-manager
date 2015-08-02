'use strict';

var spawn = require('child_process').spawn;

var Auth = require('./Auth');

function Connection(server) {
  this.server = server;
}

Connection.prototype.connect = function(cb) {
  var ssh = spawn('ssh', this.createSshParams());

  ssh.on('close', end);

  function end(code) {
    process.stdin.setRawMode(false);
    process.stdin.unpipe(ssh.stdin);
    ssh.stdout.unpipe(process.stdout);
    ssh.stderr.unpipe(process.stderr);

    cb(code);
  }

  process.stdin.setRawMode(true);
  process.stdin.pipe(ssh.stdin);
  ssh.stdout.pipe(process.stdout);
  ssh.stderr.pipe(process.stderr);
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
