const path = require('path');
const { expect } = require('chai');

const Auth = require('../lib/Auth');

describe('Auth', () => {
  describe('constructor', () => {
    it('should create an Auth instance', () => {
      expect(new Auth(Auth.PASSWORD)).to.be.an.instanceof(Auth);
    });
  });
  describe('existsPemFile', () => {
    it('should return true for password auth', (cb) => {
      const auth = new Auth(Auth.PASSWORD);
      auth.existsPemFile((exists) => {
        expect(exists).to.be.true;
        cb();
      });
    });
    it('should return true for existing pem files', (cb) => {
      const auth = new Auth(Auth.PEM, path.join(__dirname, 'resources/file.pem'));
      auth.existsPemFile((exists) => {
        expect(exists).to.be.true;
        cb();
      });
    });
    it('should return false for missing pem files', (cb) => {
      const auth = new Auth(Auth.PEM, path.join(__dirname, 'resources/file_missing.pem'));
      auth.existsPemFile((exists) => {
        expect(exists).to.be.false;
        cb();
      });
    });
  });
  describe('toString', () => {
    it('should return the type field', () => {
      const auth = new Auth(Auth.PASSWORD);
      expect(auth.toString()).to.be.equal(Auth.PASSWORD);
    });
  });
});
