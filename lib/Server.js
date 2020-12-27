const net = require('net');

class Server {
  constructor(name, user, host, port, auth) {
    this.name = name;
    this.user = user;
    this.host = host;
    this.port = port;
    this.auth = auth;

    this.id = ++Server.instanceId;
    this.reachable = false;
  }

  checkConnection(timeout, cb) {
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

Server.instanceId = 0;

module.exports = Server;
