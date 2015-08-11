'use strict';

var async = require('async');
var colors = require('colors');
var ut = require('ut');
var Table = require('cli-table');
var yargs = require('yargs');

var ServerReader = require('./lib/ServerReader');
var Connection = require('./lib/Connection');

// Variables

var STATUS_COLUMN_INDEX = 2;

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
  head: [
    colors.cyan.bold(headers.name), colors.cyan.bold(headers.id),
    colors.cyan.bold(headers.status), colors.cyan.bold(headers.user),
    colors.cyan.bold(headers.host), colors.cyan.bold(headers.port),
    colors.cyan.bold(headers.auth)
  ],
  style: {compact: true, 'padding-left': 1}
});

// Arguments config

var argv = yargs.usage('Usage: $0 [options]')
    .alias('f', 'file')
    .nargs('f', 1)
    .describe('f', 'Provide a json or csv file with servers')
    .string('f')

    .alias('o', 'order')
    .nargs('o', 1)
    .string('o')
    .choices('o', Object.keys(headers))
    .describe('o', 'Order the table by the given column')

    .alias('s', 'server')
    .nargs('s', 1)
    .string('s')
    .describe('s', 'Specify the server name or id to connect')

    .alias('n', 'nocheck')
    .describe('n', 'Disable the server connection checkings')
    .nargs('n', 0)
    .boolean('n')

    .alias('t', 'timeout')
    .nargs('t', 1)
    .default('t', 500)
    .describe('t', 'Timeout for server checkings in milliseconds')

    .help('h')
    .alias('h', 'help')
    .epilog('https://github.com/alemures')
    .strict()
    .argv;

// Main code

main();

// Functions

function main() {
  process.stdin.resume();
  var files = [__dirname + '/servers/servers.json',
      __dirname + '/servers/servers.csv'];

  if (isValidString(argv.file)) {
    files = [argv.file];
  }

  var errs = [];
  async.eachSeries(files, function(file, cb) {
    ServerReader.read(file, function(err, servs) {
      if (err) {
        err.file = file;
        errs.push(err);
        cb();
        return;
      }

      servers = servs;

      if (isValidString(argv.order)) {
        servers.sort(comparator(argv.order));
      }

      populateTable();

      showMenu('Welcome to SSH Manager, type the name or id of a server\nUsing file: ' + file);

      cb('done');
    });
  },

  function(err) {
    if (err !== 'done') {
      console.error(errs);
      process.exit(-1);
    }
  });
}

function populateTable() {
  var serversLength = servers.length;
  var i;
  var server;
  var portHeaderLength = headers.port.length;

  for (i = 0; i < serversLength; i++) {
    server = servers[i];
    table.push([
      colors.cyan.bold(server.name), server.id, reachableToString(server.reachable),
      server.user, server.host, ut.paddingBoth('' + server.port, ' ',
      portHeaderLength), server.auth.type
    ]);
  }
}

function reachableToString(reachable) {
  var headerLength = headers.status.length;

  if (argv.nocheck) {
    return ut.paddingBoth('-', ' ', headerLength);
  }

  return reachable ? colors.yellow.bold(ut.paddingBoth('up', ' ', headerLength)) :
      colors.red.bold(ut.paddingBoth('down', ' ', headerLength));
}

function updateTable() {
  var serversLength = servers.length;
  var i;
  var server;
  var row;

  for (i = 0; i < serversLength; i++) {
    server = servers[i];
    row = table[i];

    if (server.reachable !== row[STATUS_COLUMN_INDEX]) {
      row[STATUS_COLUMN_INDEX] = reachableToString(server.reachable);
    }
  }
}

function showMenu(message) {
  if (argv.nocheck) {
    showServers(message);
    readLine();
  } else {
    checkServerConnections(function() {
      updateTable();
      showServers(message);
      readLine();
    });
  }
}

function checkServerConnections(cb) {
  async.each(servers, function(server, cb) {
    server.checkConnection(argv.timeout, cb);
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
  if (isValidString(argv.server)) {
    processLine(argv.server);
    argv.server = null;
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
    if (servers[i].id === parseInt(option) ||
        servers[i].name.toLowerCase() === option.toLowerCase()) {
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
