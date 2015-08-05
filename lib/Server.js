'use strict';

var spawn = require('child_process').spawn;

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

Server.prototype.checkConnection = function(cb) {
  var ping = spawn('ping', ['-c', '1', '-W', '1', this.host]);
  var _this = this;
  var success = false;

  ping.stdout.on('data', function(data) {
    if (data.toString().indexOf('1 received') > -1) {
      success = true;
    }
  });

  ping.stdout.on('end', function() {
    _this.reachable = success;
    cb();
  });
};

module.exports = Server;
