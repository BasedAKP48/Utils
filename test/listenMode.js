const expect = require('unexpected');
const { Connector, Module, Plugin } = require('../index');
const createFakeRoot = require('./helpers/fakeRoot');

describe('Module registry info', () => {
  const register = async (create) => {
    const db = createFakeRoot();
    create(db).presenceSystem();
    db.emit('.info/connected', true);
    await new Promise(resolve => setImmediate(resolve));
    return db.get('registry/m1/info');
  };
  const base = db => ({
    root: db.root, cid: 'm1', pkg: { name: 'pkg', dependencies: {} }, useBasicConfig: false,
  });

  it('Should register a connector as a connector', async () => {
    const info = await register(db => new Connector(base(db)));

    expect(info, 'to satisfy', { listenMode: 'connector' });
  });

  it('Should register a plugin as a plugin', async () => {
    const info = await register(db => new Plugin(base(db)));

    expect(info, 'to satisfy', { listenMode: 'normal' });
  });

  it('Should register whatever mode a module was created with', async () => {
    const info = await register(db => new Module({ ...base(db), type: 'core', listenMode: 'core' }));

    expect(info, 'to satisfy', { listenMode: 'core' });
  });
});
