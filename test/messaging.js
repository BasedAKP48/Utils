const { MessagingSystem } = require('../index');
const expect = require('unexpected');

describe('MessagingSystem', () => {
  it('Should be unique', () => expect(MessagingSystem(), 'not to be', MessagingSystem()));
});

describe('MessagingSystem client queue', () => {
  const create = () => {
    const callbacks = {};
    const stub = path => ({
      on: (event, callback) => { callbacks[`${path}:${event}`] = callback; },
      child: sub => stub(`${path}/${sub}`),
      orderByChild: () => ({ startAt: () => stub(`${path}:ordered`) }),
    });
    const system = MessagingSystem();
    system.initialize({ cid: 'me', rootRef: stub(''), listenMode: 'connector' });
    return { system, deliver: snapshot => callbacks['/clients/me:child_added'](snapshot) };
  };
  const snapshot = value => ({ val: () => value, ref: { key: 'k' } });

  it('Should emit the direction of messages sent to this client', () => {
    const { system, deliver } = create();
    const seen = [];
    ['message', 'message-out', 'message-in', 'message/internal', 'message-undefined']
      .forEach(event => system.on(event, () => seen.push(event)));

    deliver(snapshot({ type: 'internal', direction: 'out' }));

    expect(seen, 'to equal', ['message', 'message-out', 'message/internal']);
  });

  it('Should hand over the message and where it lives', () => {
    const { system, deliver } = create();
    const received = [];
    system.on('message/internal', (msg, ref) => received.push([msg, ref]));
    const first = snapshot({ type: 'Internal', direction: 'in', text: 'x' });

    deliver(first);

    expect(received, 'to equal', [[{ type: 'Internal', direction: 'in', text: 'x' }, first.ref]]);
  });
});
