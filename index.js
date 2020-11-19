const async = require('async');
const colors = require('colors');
const path = require('path');
const Table = require('cli-table');
const ut = require('utjs');
const yargs = require('yargs');

const ServerReader = require('./lib/ServerReader');
const Connection = require('./lib/Connection');

// Variables

const STATUS_COLUMN_INDEX = 2;

let servers = [];

const headers = {
  name: 'name',
  id: 'id',
  status: 'status',
  user: 'user',
  host: 'host',
  port: 'port',
  auth: 'auth',
};

const table = new Table({
  head: [
    colors.cyan.bold(headers.name), colors.cyan.bold(headers.id),
    colors.cyan.bold(headers.status), colors.cyan.bold(headers.user),
    colors.cyan.bold(headers.host), colors.cyan.bold(headers.port),
    colors.cyan.bold(headers.auth),
  ],
  style: { compact: true, 'padding-left': 1 },
});

// Arguments config

const { argv } = yargs.usage('Usage: $0 [options]')
  .alias('f', 'file')
  .nargs('f', 1)
  .describe('f', 'Provide a json or csv file with servers')
  .string('f')

  .alias('o', 'order')
  .nargs('o', 1)
  .string('o')
  .choices('o', Object.keys(headers).filter((item) => item !== headers.status))
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
  .strict();

// Main code

main();

// Functions

function main() {
  process.stdin.resume();
  const file = isValidString(argv.file)
    ? path.resolve(argv.file)
    : path.join(__dirname, 'servers/servers.json');

  ServerReader.read(file, (err, servs) => {
    if (err) {
      console.error(err);
      process.exit(-1);
    }

    servers = servs;

    if (isValidString(argv.order)) {
      servers.sort(comparator(argv.order));
    }

    populateTable();

    showMenu(`Welcome to SSH Manager, type the name or id of a server\nUsing file: ${file}`);
  });
}

function populateTable() {
  const portHeaderLength = headers.port.length;

  servers.forEach((server) => {
    table.push([
      colors.cyan.bold(server.name), server.id, reachableToString(server.reachable),
      server.user, server.host, ut.paddingBoth(String(server.port), ' ', portHeaderLength), server.auth.type,
    ]);
  });
}

function reachableToString(reachable) {
  const headerLength = headers.status.length;

  if (argv.nocheck) {
    return ut.paddingBoth('-', ' ', headerLength);
  }

  return reachable ? colors.yellow.bold(ut.paddingBoth('up', ' ', headerLength))
    : colors.red.bold(ut.paddingBoth('down', ' ', headerLength));
}

function updateTable() {
  servers.forEach((server, i) => {
    const row = table[i];

    if (server.reachable !== row[STATUS_COLUMN_INDEX]) {
      row[STATUS_COLUMN_INDEX] = reachableToString(server.reachable);
    }
  });
}

function showMenu(message) {
  if (argv.nocheck) {
    showServers(message);
    readLine();
  } else {
    checkServerConnections(() => {
      updateTable();
      showServers(message);
      readLine();
    });
  }
}

function checkServerConnections(cb) {
  async.each(servers, (server, internalCb) => {
    server.checkConnection(argv.timeout, internalCb);
  }, cb);
}

function showServers(message) {
  // Clear screen
  process.stdout.write('\u001b[2J\u001b[0;0H');

  console.log(table.toString());

  console.log(`LOG -> ${colors.gray(message || '')}`);
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
  const option = data.toString().trim();

  if (option === 'quit' || option === 'exit') {
    console.log('Bye!');
    process.exit(0);
  }

  const server = servers.find((serv) => serv.id === parseInt(option, 10)
    || serv.name.toLowerCase() === option.toLowerCase());

  if (server) {
    connect(server);
  } else {
    showMenu(`The server "${option}" doesn't exist`);
  }
}

function connect(server) {
  const connection = new Connection(server);
  connection.connect((code, signal) => {
    let message = `Connection to "${server.name}" closed with code ${code}`;

    if (signal) {
      message += ` and signal ${signal}`;
    }

    showMenu(message);
  });
}

function comparator(col) {
  return (a, b) => {
    const val1 = a[col].toString();
    const val2 = b[col].toString();

    if (val1 > val2) {
      return 1;
    }

    if (val1 < val2) {
      return -1;
    }

    return 0;
  };
}

function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
