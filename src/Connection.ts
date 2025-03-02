import pty from 'node-pty';

import { Auth, AuthType } from './Auth';
import { Server } from './Server';

export class Connection {
  server: Server;
  timeout: number;

  constructor(server: Server) {
    this.server = server;
    this.timeout = 2500;
  }

  connect(cb: {
    (code: any, signal: any): void;
    (arg0: any, arg1: any): void;
  }) {
    console.info('Connecting...');
    let connected = false;

    const ssh = pty.spawn('ssh', this.createSshParams(), {
      cols: process.stdout.columns,
      rows: process.stdout.rows,
    });

    ssh.onData(onData);
    ssh.onExit(onExit);
    process.on('SIGINT', ctrlCPressed);
    process.stdout.on('resize', onResize);

    function onData(data: string | Uint8Array) {
      if (!connected) {
        onConnect();
        connected = true;
      }

      process.stdout.write(data);
    }

    function onExit(result: { exitCode: number; signal?: number }) {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('data', inputToSsh);
      process.removeListener('SIGINT', ctrlCPressed);
      process.stdout.removeListener('resize', onResize);

      cb(result.exitCode, result.signal);
    }

    function onConnect() {
      process.stdin.setRawMode(true);
      process.stdin.on('data', inputToSsh);
    }

    function onResize() {
      ssh.resize(process.stdout.columns, process.stdout.rows);
    }

    function inputToSsh(data: string) {
      ssh.write(data);
    }

    function ctrlCPressed() {
      ssh.kill('SIGINT');
    }
  }

  createSshParams() {
    const params = ['-tt', `${this.server.user}@${this.server.host}`];

    if (this.server.auth.type === AuthType.PEM && this.server.auth.pemFile) {
      params.unshift(this.server.auth.pemFile);
      params.unshift('-i');
    }

    return params;
  }
}
