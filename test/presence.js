const { PresenceSystem } = require('../index');
const expect = require('unexpected');

describe('PresenceSystem', () => {
  it('Should be unique', () => expect(PresenceSystem(), 'not to be', PresenceSystem()));
});
