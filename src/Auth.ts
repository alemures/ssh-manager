import fs from 'fs';

export enum AuthType {
  PASSWORD,
  PEM,
}

export class Auth {
  type: AuthType;
  pemFile?: string;

  constructor(type: AuthType, pemFile?: string) {
    this.type = type;
    this.pemFile = pemFile;
  }

  existsPemFile(cb: (exists: boolean) => void) {
    if (this.type === AuthType.PEM) {
      if (!this.pemFile) {
        cb(false);
        return;
      }

      fs.exists(this.pemFile, (exists) => {
        if (exists) {
          cb(true);
        } else {
          cb(false);
        }
      });
    } else {
      cb(true);
    }
  }

  toString() {
    return this.type;
  }
}
