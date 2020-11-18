const { exec } = require('child_process');

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
    exec(`echo quit | telnet ${this.host} 22 2> /dev/null | grep Connected`, { timeout },
      (err, stdout) => {
        if (!err && stdout.indexOf('Connected') > -1) {
          this.reachable = true;
        }

        cb();
      });
  }
}

Server.instanceId = 0;

module.exports = Server;
