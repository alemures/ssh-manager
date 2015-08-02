'use strict';

var async = require('async');
var colors = require('colors');
var ut = require('ut');

var ServerReader = require('./lib/ServerReader');
var Connection = require('./lib/Connection');

// Variables

var TITLE = '** SSH Manager **';
var WIDTH = 80;

var servers = [];

// Main code

main();

// Functions

function main() {
  process.stdin.resume();

  ServerReader.read(__dirname + '/servers/servers.json', function(err, servs) {
    if (err) {
      console.log(err);
      process.exit(-1);
    }

    servers = servs;
    showMenu('Welcome to SSH Manager!');
  });
}

function showMenu(message) {
  checkServerConnections(function() {
    showServers(message);
    readLine();
  });
}

function checkServerConnections(cb) {
  async.each(servers, function(server, cb) {
    server.checkConnection(cb);
  }, cb);
}

function showServers(message) {
  // Clear screen
  process.stdout.write('\u001b[2J\u001b[0;0H');

  var noServersText = 'No Servers';
  var length = servers.length;
  var i;

  console.log(ut.createPadding('-', WIDTH));
  console.log(ut.createPadding(' ', Math.floor(WIDTH / 2 - TITLE.length / 2)) + TITLE);
  console.log(ut.createPadding('-', WIDTH));

  for (i = 0; i < servers.length; i++) {
    console.log(servers[i].toString());
  }

  if (length === 0) {
    console.log(ut.createPadding(' ', Math.floor(WIDTH / 2 - noServersText.length / 2)) + noServersText);
  }

  console.log(ut.createPadding('-', WIDTH));
  console.log('LOG -> ' + colors.gray(message ? message : ''));
  console.log('');
  process.stdout.write('Choose a server: ');
}

function readLine() {
  process.stdin.once('data', processLine);
}

function processLine(data) {
  var option = data.toString().trim();

  if (option === 'quit' || option === 'exit') {
    console.log('Bye!');
    process.exit(0);
  }

  for (var i = 0; i < servers.length; i++) {
    if (servers[i].id === parseInt(option) || servers[i].name === option) {
      connect(servers[i]);
      return;
    }
  }

  showMenu('The server "' + option + '" doesn\'t exist');
}

function connect(server) {
  var connection = new Connection(server);
  connection.connect(function(code) {
    var message = 'Connection with "' + server.name + '" closed';

    if (code !== 0) {
      message += ' with code ' + code;
    }

    showMenu(message);
  });
}
