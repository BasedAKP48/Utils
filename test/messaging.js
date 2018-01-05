const { MessagingSystem } = require('../index');
const expect = require('unexpected');

describe('MessagingSystem', () => {
  it('Should be unique', () => expect(MessagingSystem(), 'not to be', MessagingSystem()));
});
