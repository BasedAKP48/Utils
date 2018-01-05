const { ensureRequired } = require('../');
const { expect } = require('chai');

describe('ensureRequired', () => {
  const options = ['testOne', 'testTwo'];
  const badObj = { testOne: 'wow' };
  const goodObj = { testOne: 'wow', testTwo: false };

  it('Should reject an object missing required options', () => {
    expect(ensureRequired(badObj, options)).to.be.false;
  });

  it('Should accept an object with all required options', () => {
    expect(ensureRequired(goodObj, options)).to.be.true;
  });
});
