/* eslint-env node, mocha */
const utils = require('../index.js');
const expect = require('unexpected');

describe('Utils', () => {
  describe('getSafeObject', () => {
    const blankObject = {};
    const dirtyObject = {
      '/dirtykey': true,
      'other[dirtykey]': true,
      cleanKey: true,
    };
    const cleanObject = {
      cleanKey1: true,
      cleanKey2: true,
      cleanKey3: false,
    };
    const cleanedObject = {
      '|dirtykey': true,
      'other|dirtykey|': true,
      cleanKey: true,
    };

    it('Should be the same empty object', () => {
      expect(utils.getSafeObject(blankObject), 'to be', blankObject);
    });

    it('Should be the same cleanObject', () => {
      expect(utils.getSafeObject(cleanObject), 'to be', cleanObject);
    });

    it('Should not be the same object', () => {
      expect(utils.getSafeObject(dirtyObject), 'not to be', dirtyObject);
    });

    it('Should be a clean object', () => {
      expect(utils.getSafeObject(dirtyObject), 'to exhaustively satisfy', cleanedObject);
    });
  });
});

