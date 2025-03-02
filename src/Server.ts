import net from 'net';
import { Auth } from './Auth';

export class Server {
  static instanceId = 0;
  name: string;
  user: string;
  host: string;
  port: number;
  auth: Auth;
  id: number;
  reachable: boolean;

  constructor(
    name: string,
    user: string,
    host: string,
    port: number,
    auth: Auth
  ) {
    this.name = name;
    this.user = user;
    this.host = host;
    this.port = port;
    this.auth = auth;

    this.id = ++Server.instanceId;
    this.reachable = false;
  }

  checkConnection(timeout: number, cb: () => void) {
    const timeoutId = setTimeout(() => socket.destroy(), timeout);
    const socket = net.createConnection(this.port, this.host, () => {
      this.reachable = true;
      clearTimeout(timeoutId);
      socket.end();
    });

    socket.on('error', () => {});
    socket.on('close', () => cb());
  }
}
