import path from 'path';
import { Auth, AuthType } from '../src/Auth';

describe('Auth', () => {
  describe('constructor', () => {
    it('should create an Auth instance', () => {
      expect(new Auth(AuthType.PASSWORD)).toBeInstanceOf(Auth);
    });
  });
  describe('existsPemFile', () => {
    it('should return true for password auth', (cb) => {
      const auth = new Auth(AuthType.PASSWORD);
      auth.existsPemFile((exists) => {
        expect(exists).toBe(true);
        cb();
      });
    });
    it('should return true for existing pem files', (cb) => {
      const auth = new Auth(
        AuthType.PEM,
        path.join(__dirname, 'resources/file.pem')
      );
      auth.existsPemFile((exists) => {
        expect(exists).toBe(true);
        cb();
      });
    });
    it('should return false for missing pem files', (cb) => {
      const auth = new Auth(
        AuthType.PEM,
        path.join(__dirname, 'resources/file_missing.pem')
      );
      auth.existsPemFile((exists) => {
        expect(exists).toBe(false);
        cb();
      });
    });
  });
  describe('toString', () => {
    it('should return the type field', () => {
      const auth = new Auth(AuthType.PASSWORD);
      expect(auth.toString()).toEqual(AuthType.PASSWORD);
    });
  });
});
