import async from 'async';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

import { Server } from './Server';
import { Auth, AuthType } from './Auth';

export function readServers(
  file: string,
  cb: { (err: undefined, servs: Server[]): void; (err: unknown): void }
) {
  const ext = path.extname(file);
  fs.readFile(file, (err, fileContent) => {
    if (err) {
      cb(err);
      return;
    }

    let parsedFile: ServerParams[];

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

interface ServerParams {
  name: string;
  user: string;
  host: string;
  port?: string;
  pem?: string;
}

function parseJson(fileContent: string) {
  return JSON.parse(fileContent) as ServerParams[];
}

function parseCsv(fileContent: string) {
  const parse = Papa.parse(fileContent, {
    skipEmptyLines: true,
  });

  const rows = parse.data;
  const serversJson: ServerParams[] = [];

  for (let i = 1; i < rows.length; i++) {
    const serverJson: ServerParams = {
      name: rows[i][0],
      user: rows[i][1],
      host: rows[i][2],
    };

    if (rows[i][3]) {
      serverJson.port = rows[i][3];
    }

    if (rows[i][4]) {
      // eslint-disable-next-line prefer-destructuring
      serverJson.pem = rows[i][4];
    }

    serversJson.push(serverJson);
  }

  return serversJson;
}

function createServers(
  file: string,
  parsedFile: ServerParams[],
  cb: {
    (err: undefined, servs: Server[]): void;
    (err: unknown): void;
    (arg0: Error | null | undefined, arg1: any[]): void;
  }
) {
  const servers: Server[] = [];

  async.each(
    parsedFile,
    (serverJson, internalCb) => {
      const port = serverJson.port ? Number(serverJson.port) : 22;
      let auth;

      if (serverJson.pem) {
        const filePath = path.normalize(path.parse(file).dir);
        auth = new Auth(AuthType.PEM, path.resolve(filePath, serverJson.pem));
      } else {
        auth = new Auth(AuthType.PASSWORD);
      }

      if (!serverJson.name || !serverJson.user || !serverJson.host) {
        internalCb(new Error('Invalid required fields name, user or host'));
        return;
      }

      const server = new Server(
        serverJson.name,
        serverJson.user,
        serverJson.host,
        port,
        auth
      );

      auth.existsPemFile((exists) => {
        if (!exists) {
          internalCb(
            new Error(
              `The pem file "${server.auth.pemFile}" used in server "${server.name}" does't exist`
            )
          );
          return;
        }

        servers.push(server);
        internalCb();
      });
    },

    (err) => cb(err, servers)
  );
}
