'use strict';

var fs = require('fs');

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
  var length = parsedFile.length;
  var serverJson;

  var port;
  var auth;
  var server;
  var servers = [];

  for (i = 0; i < length; i++) {
    serverJson = parsedFile[i];

    if (serverJson.pem) {
      auth = new Auth(Auth.PEM, serverJson.pem);
    } else {
      auth = new Auth(Auth.PASSWORD);
    }

    if (!serverJson.name || !serverJson.user || !serverJson.host) {
      cb(new Error('Invalid required fields name, user or host for the server #' + i));
      return;
    }

    port = serverJson.port ? serverJson.port : 22;

    server = new Server(serverJson.name, serverJson.user, serverJson.host, port, auth);
    servers.push(server);
  }

  cb(null, servers);
}

module.exports.read = readServers;
