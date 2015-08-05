'use strict';

var async = require('async');
var colors = require('colors');
var ut = require('ut');
var Table = require('cli-table');

var ServerReader = require('./lib/ServerReader');
var Connection = require('./lib/Connection');

// Variables

var servers = [];

var table = new Table({
  head: [colors.cyan.bold('name'), colors.cyan.bold('id'), colors.cyan.bold('status'),
      colors.cyan.bold('user'), colors.cyan.bold('host'), colors.cyan.bold('port'), colors.cyan.bold('auth')],
  style: {compact: true, 'padding-left': 1}
});
var statusColumn = 2;

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

    populateTable();

    showMenu('Welcome to SSH Manager, type the name or id of a server');
  });
}

function populateTable() {
  var serversLength = servers.length;
  var i;
  var server;

  for (i = 0; i < serversLength; i++) {
    server = servers[i];
    table.push([colors.cyan.bold(server.name), server.id, reachableToString(server.reachable),
        server.user, server.host, server.port, server.auth.type]);
  }
}

function reachableToString(reachable) {
  return reachable ? colors.yellow.bold('up') : colors.red.bold('down');
}

function updateTable() {
  var serversLength = servers.length;
  var i;
  var server;
  var row;

  for (i = 0; i < serversLength; i++) {
    server = servers[i];
    row = table[i];

    if (server.reachable !== row[statusColumn]) {
      row[statusColumn] = reachableToString(server.reachable);
    }
  }
}

function showMenu(message) {
  checkServerConnections(function() {
    updateTable();
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

  console.log(table.toString());

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
    if (servers[i].id === parseInt(option) || servers[i].name.toLowerCase() === option.toLowerCase()) {
      connect(servers[i]);
      return;
    }
  }

  showMenu('The server "' + option + '" doesn\'t exist');
}

function connect(server) {
  var connection = new Connection(server);
  connection.connect(function(code, signal) {
    var message;

    if (ut.isNumber(code)) {
      // Process exited normally
      message = 'Connection to "' + server.name + '" closed with code ' + code;
    } else {
      // Process killed by parent
      message = 'Connection to "' + server.name + '" killed by parent with signal ' + signal;
    }

    showMenu(message);
  });
}
