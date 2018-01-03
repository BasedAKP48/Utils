/* eslint-env node, mocha */
const utils = require('../index.js');
const expect = require('unexpected');

describe('Utils', () => {
  describe('safeObject', () => {
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
      expect(utils.safeObject(blankObject), 'to be', blankObject);
    });

    it('Should be the same clean object', () => {
      expect(utils.safeObject(cleanObject), 'to be', cleanObject);
    });

    it('Should not be dirty', () => {
      expect(utils.safeObject(dirtyObject), 'not to be', dirtyObject);
    });

    it('Should be a cleaned object', () => {
      expect(utils.safeObject(dirtyObject), 'to exhaustively satisfy', cleanedObject);
    });
  });
  describe('safeString', () => {
    const cleanString = '-L1voea_NjTN8H36e8px';
    const dirtyString = '@basedakp48/plugin-utils';
    const cleanedString = '@basedakp48|plugin-utils';

    it('Should be the same clean string', () => {
      expect(utils.safeString(cleanString), 'to be', cleanString);
    });

    it('Should be a cleaned string', () => {
      expect(utils.safeString(dirtyString), 'to be', cleanedString);
    });
  });
});

