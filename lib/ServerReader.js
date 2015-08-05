'use strict';

var fs = require('fs');

var async = require('async');

var Server = require('./Server');
var Auth = require('./Auth');

function readServers(file, cb) {
  fs.readFile(file, function(err, fileContent) {
    if (err) {
      cb(err);
      return;
    }

    var parsedFile;

    try {
      parsedFile = JSON.parse(fileContent.toString());
    } catch (e) {
      cb(e);
      return;
    }

    createServers(parsedFile, cb);
  });
}

function createServers(parsedFile, cb) {
  var i;

  var port;
  var auth;
  var server;
  var servers = [];

  async.each(parsedFile, function(serverJson, cb) {
    port = serverJson.port ? serverJson.port : 22;

    if (serverJson.pem) {
      auth = new Auth(Auth.PEM, serverJson.pem);
    } else {
      auth = new Auth(Auth.PASSWORD);
    }

    if (!serverJson.name || !serverJson.user || !serverJson.host) {
      cb(new Error('Invalid required fields name, user or host for the server #' + i));
      return;
    }

    auth.existsPemFile(function(exists) {
      if (!exists) {
        cb(new Error('The pem file "' + server.auth.pemFile +
            '"" used in server "' + server.name + '" does\'t exist'));
        return;
      }

      server = new Server(serverJson.name, serverJson.user, serverJson.host, port, auth);
      servers.push(server);
      cb();
    });
  }, function(err) {

    cb(err, servers);
  });
}

module.exports.read = readServers;
