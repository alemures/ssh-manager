'use strict';

var exec = require('child_process').exec;

function Server(name, user, host, port, auth) {
  this.name = name;
  this.user = user;
  this.host = host;
  this.port = port;
  this.auth = auth;

  this.id = ++Server.instanceId;
  this.reachable = false;
}

Server.instanceId = 0;

Server.prototype.checkConnection = function(timeout, cb) {
  var _this = this;

  exec('echo quit | telnet ' + this.host + ' 22 2> /dev/null | grep Connected',
      { timeout: timeout }, processOutput);

  function processOutput(err, stdout, stderr) {
    if (err) {
      console.log(err);
      cb();
      return;
    }

    if (stdout.indexOf('Connected') > -1) {
      _this.reachable = true;
    }

    cb();
  }
};

module.exports = Server;
