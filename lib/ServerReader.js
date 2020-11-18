const async = require('async');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const Server = require('./Server');
const Auth = require('./Auth');

function readServers(file, cb) {
  const ext = path.extname(file);
  fs.readFile(file, (err, fileContent) => {
    if (err) {
      cb(err);
      return;
    }

    let parsedFile;

    try {
      if (ext === '.json') {
        parsedFile = parseJson(fileContent.toString());
      } else if (ext === '.csv') {
        parsedFile = parseCsv(fileContent.toString());
      } else {
        cb(new Error('Invalid file type, required .json or .csv'));
        return;
      }
    } catch (subErr) {
      cb(subErr);
      return;
    }

    createServers(file, parsedFile, cb);
  });
}

function parseJson(fileContent) {
  return JSON.parse(fileContent.toString());
}

function parseCsv(fileContent) {
  const parse = Papa.parse(fileContent, {
    skipEmptyLines: true,
  });

  const rows = parse.data;
  const serversJson = [];

  for (let i = 1; i < rows.length; i++) {
    const serverJson = {
      name: rows[i][0],
      user: rows[i][1],
      host: rows[i][2],
      port: rows[i][3],
    };

    if (rows[i][4]) {
      // eslint-disable-next-line prefer-destructuring
      serverJson.pem = rows[i][4];
    }

    serversJson.push(serverJson);
  }

  return serversJson;
}

function createServers(file, parsedFile, cb) {
  const servers = [];

  async.each(parsedFile, (serverJson, internalCb) => {
    const port = serverJson.port ? serverJson.port : 22;
    let auth;

    if (serverJson.pem) {
      const filePath = path.normalize(path.parse(file).dir);
      auth = new Auth(Auth.PEM, path.resolve(filePath, serverJson.pem));
    } else {
      auth = new Auth(Auth.PASSWORD);
    }

    if (!serverJson.name || !serverJson.user || !serverJson.host) {
      internalCb(new Error('Invalid required fields name, user or host'));
      return;
    }

    const server = new Server(serverJson.name, serverJson.user, serverJson.host, port, auth);

    auth.existsPemFile((exists) => {
      if (!exists) {
        internalCb(new Error(`The pem file "${server.auth.pemFile}" used in server "${server.name}" does't exist`));
        return;
      }

      servers.push(server);
      internalCb();
    });
  },

  (err) => cb(err, servers));
}

module.exports.read = readServers;
