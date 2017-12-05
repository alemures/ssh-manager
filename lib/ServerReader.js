'use strict';

var fs = require('fs');
var path = require('path');

var async = require('async');
var Papa = require('papaparse');

var Server = require('./Server');
var Auth = require('./Auth');

function readServers(file, cb) {
  var ext = path.extname(file);
  fs.readFile(file, function(err, fileContent) {
    if (err) {
      cb(err);
      return;
    }

    fileContent = fileContent.toString();
    var parsedFile;

    try {
      if (ext === '.json') {
        parsedFile = parseJson(fileContent);
      } else if (ext === '.csv') {
        parsedFile = parseCsv(fileContent);
      } else {
        cb(new Error('Invalid file type, required .json or .csv'));
        return;
      }
    } catch (err) {
      cb(err);
      return;
    }

    createServers(file, parsedFile, cb);
  });
}

function parseJson(fileContent) {
  return JSON.parse(fileContent.toString());
}

function parseCsv(fileContent) {
  var parse = Papa.parse(fileContent, {
    skipEmptyLines: true
  });

  var rows = parse.data;
  var rowsLength = rows.length;
  var serversJson = [];
  var serverJson;
  var i;

  for (i = 1; i < rowsLength; i++) {
    serverJson = { name: rows[i][0], user: rows[i][1], host: rows[i][2], port: rows[i][3] };

    if (rows[i][4]) {
      serverJson.pem = rows[i][4];
    }

    serversJson.push(serverJson);
  }

  return serversJson;
}

function createServers(file, parsedFile, cb) {
  var servers = [];

  async.each(parsedFile, function(serverJson, cb) {
    var port = serverJson.port ? serverJson.port : 22;
    var auth;

    if (serverJson.pem) {
      var filePath = path.normalize(path.parse(file).dir);
      auth = new Auth(Auth.PEM, path.resolve(filePath, serverJson.pem));
    } else {
      auth = new Auth(Auth.PASSWORD);
    }

    if (!serverJson.name || !serverJson.user || !serverJson.host) {
      cb(new Error('Invalid required fields name, user or host'));
      return;
    }

    var server = new Server(serverJson.name, serverJson.user, serverJson.host, port, auth);

    auth.existsPemFile(function(exists) {
      if (!exists) {
        cb(new Error('The pem file "' + server.auth.pemFile +
            '" used in server "' + server.name + '" does\'t exist'));
        return;
      }

      servers.push(server);
      cb();
    });
  },

  function(err) {
    cb(err, servers);
  });
}

module.exports.read = readServers;
