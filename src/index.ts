import async from 'async';
import colors from 'colors';
import path from 'path';
import Table from 'cli-table';
import ut from 'utjs';
import yargs, { parseSync } from 'yargs';

import { readServers } from './ServerReader';
import { Connection } from './Connection';
import { Server } from './Server';

// Variables

const STATUS_COLUMN_INDEX = 2;

let servers: Server[] = [];

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
    colors.cyan.bold(headers.name),
    colors.cyan.bold(headers.id),
    colors.cyan.bold(headers.status),
    colors.cyan.bold(headers.user),
    colors.cyan.bold(headers.host),
    colors.cyan.bold(headers.port),
    colors.cyan.bold(headers.auth),
  ],
  style: { compact: true, 'padding-left': 1 },
});

// Arguments config

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 [options]')

  .options({
    f: {
      alias: 'file',
      nargs: 1,
      type: 'string',
      describe: 'Provide a json or csv file with servers',
    },
    o: {
      alias: 'order',
      nargs: 1,
      type: 'string',
      choices: Object.keys(headers).filter((item) => item !== headers.status),
      describe: 'Order the table by the given column',
    },
    s: {
      alias: 'server',
      nargs: 1,
      type: 'string',
      describe: 'Specify the server name or id to connect',
    },
    n: {
      alias: 'nocheck',
      nargs: 0,
      type: 'boolean',
      describe: 'Disable the server connection checks',
    },
    t: {
      alias: 'timeout',
      nargs: 1,
      default: 500,
      describe: 'Timeout for server checks in milliseconds',
    },
  })

  .help('h')
  .alias('h', 'help')
  .epilog('https://github.com/alemures')
  .strict()
  .parseSync();

// Main code

main();

// Functions

function main() {
  process.stdin.resume();
  const file = isValidString(argv.f)
    ? path.resolve(argv.f)
    : path.join(__dirname, 'servers/servers.json');

  readServers(file, (err, servs) => {
    if (err) {
      console.error(err);
      process.exit(-1);
    }

    servers = servs;

    if (isValidString(argv.o)) {
      servers.sort(comparator(argv.o));
    }

    populateTable();

    showMenu(
      `Welcome to SSH Manager, type the name or id of a server\nUsing file: ${file}`
    );
  });
}

function populateTable() {
  const portHeaderLength = headers.port.length;

  servers.forEach((server) => {
    table.push([
      colors.cyan.bold(server.name),
      server.id,
      reachableToString(server.reachable),
      server.user,
      server.host,
      ut.paddingBoth(String(server.port), ' ', portHeaderLength),
      server.auth.type,
    ]);
  });
}

function reachableToString(reachable: boolean) {
  const headerLength = headers.status.length;

  if (argv.n) {
    return ut.paddingBoth('-', ' ', headerLength) as string;
  }

  return reachable
    ? colors.yellow.bold(ut.paddingBoth('up', ' ', headerLength))
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

function showMenu(message: string) {
  if (argv.n) {
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
  async.each(
    servers,
    (server, internalCb) => {
      server.checkConnection(argv.t, internalCb);
    },
    cb
  );
}

function showServers(message: string) {
  // Clear screen
  process.stdout.write('\u001b[2J\u001b[0;0H');

  console.log(table.toString());

  console.log(`LOG -> ${colors.gray(message || '')}`);
  console.log('');
  process.stdout.write('Choose a server: ');
}

function readLine() {
  if (isValidString(argv.s)) {
    processLine(argv.s);
    argv.s = undefined;
  } else {
    process.stdin.once('data', processLine);
  }
}

function processLine(data: string | Buffer) {
  const option = data.toString().trim();

  if (option === 'quit' || option === 'exit') {
    console.log('Bye!');
    process.exit(0);
  }

  const server = servers.find(
    (serv) =>
      serv.id === parseInt(option, 10) ||
      serv.name.toLowerCase() === option.toLowerCase()
  );

  if (server) {
    connect(server);
  } else {
    showMenu(`The server "${option}" doesn't exist`);
  }
}

function connect(server: Server) {
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

function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
