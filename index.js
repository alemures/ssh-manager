'use strict';

var async = require('async');
var colors = require('colors');
var ut = require('ut');
var Table = require('cli-table');
var argv = require('yargs').argv;

var ServerReader = require('./lib/ServerReader');
var Connection = require('./lib/Connection');

// Variables

var servers = [];

var headers = {
  name: 'name',
  id: 'id',
  status: 'status',
  user: 'user',
  host: 'host',
  port: 'port',
  auth: 'auth'
};

var table = new Table({
  head: [colors.cyan.bold(headers.name), colors.cyan.bold(headers.id), colors.cyan.bold(headers.status),
      colors.cyan.bold(headers.user), colors.cyan.bold(headers.host), colors.cyan.bold(headers.port), colors.cyan.bold(headers.auth)],
  style: {compact: true, 'padding-left': 1}
});
var statusColumn = 2;
var usedConnectArg = false;

var argFile = argv.f || argv.file;
var argSort = argv.s || argv.sort;
var argConnect = argv.c || argv.connect;
var argPing = argv.p || argv.ping;

// Main code

main();

// Functions

function main() {
  process.stdin.resume();
  var files = ['servers.json', 'servers.csv', __dirname + '/servers/servers.json',
      __dirname + '/servers/servers.csv'];

  if (isValidString(argFile)) {
    files = [argFile];
  }

  var errs = [];
  async.eachSeries(files, function(file, cb) {
    ServerReader.read(file, function(err, servs) {
      if (err) {
        errs.push(err);
        cb();
        return;
      }

      servers = servs;

      if (isValidString(argSort)) {
        if (headers[argSort] !== undefined) {
          servers.sort(comparator(argSort));
        } else {
          console.log(new Error('Invalid column ' + argSort + ', possibles ' + Object.keys(headers)));
          process.exit(-1);
        }
      }

      populateTable();

      showMenu('Welcome to SSH Manager, type the name or id of a server\nUsing file: ' + file);

      cb('done');
    });
  },

  function(err) {
    if (errs.length === files.length) {
      console.log(errs);
      process.exit(-1);
    }
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
  if (!argPing) {
    return '-';
  }

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
  if (argPing) {
    checkServerConnections(function() {
      updateTable();
      showServers(message);
      readLine();
    });
  } else {
    showServers(message);
    readLine();
  }
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
  if ((isValidString(argConnect) || ut.isNumber(argConnect)) && !usedConnectArg) {
    usedConnectArg = true;
    processLine(argConnect);
  } else {
    process.stdin.once('data', processLine);
  }
}

function processLine(data) {
  var option = data.toString().trim();
  var serversLength = servers.length;
  var i;

  if (option === 'quit' || option === 'exit') {
    console.log('Bye!');
    process.exit(0);
  }

  for (i = 0; i < serversLength; i++) {
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

function comparator(col) {
  return function(a, b) {
    var val1 = a[col].toString();
    var val2 = b[col].toString();

    if (val1 > val2) {
      return 1;
    } else if (val1 < val2) {
      return -1;
    }

    return 0;
  };
}

function isValidString(value) {
  return ut.isString(value) && value.trim().length > 0;
}
