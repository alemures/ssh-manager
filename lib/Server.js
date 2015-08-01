'use strict';

var util = require('util');
var spawn = require('child_process').spawn;
var ut = require('ut');

var colors = require('colors');

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

Server.prototype.toString = function() {
  var state = this.reachable ? colors.green(' UP ') : colors.red('DOWN');

  return util.format('%s. [%s] %s ==> %s%s%s -> %s %s', ut.paddingLeft('' + this.id, ' ', 3), colors.bold(state), colors.blue.underline(this.name),
      this.user, colors.yellow('@'), this.host, colors.yellow(this.port), colors.gray(this.auth));
};

module.exports = Server;
