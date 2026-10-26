const expect = require('unexpected');
const { PresenceSystem } = require('../index');
const repositoryURL = require('../lib/repositoryURL');
const createFakeRoot = require('./helpers/fakeRoot');

describe('repositoryURL', () => {
  it('Should turn npm shorthands into web addresses', () => {
    expect(repositoryURL('BasedAKP48/Core'), 'to be', 'https://github.com/BasedAKP48/Core');
    expect(repositoryURL('github:feildmaster/fmbot-wallet'), 'to be', 'https://github.com/feildmaster/fmbot-wallet');
    expect(repositoryURL('gitlab:group/project'), 'to be', 'https://gitlab.com/group/project');
    expect(repositoryURL('bitbucket:team/repo'), 'to be', 'https://bitbucket.org/team/repo');
  });

  it('Should turn git addresses into web addresses', () => {
    const expected = 'https://github.com/BasedAKP48/Utils';
    [
      'git+https://github.com/BasedAKP48/Utils.git',
      'git://github.com/BasedAKP48/Utils.git',
      'git@github.com:BasedAKP48/Utils.git',
      'ssh://git@github.com/BasedAKP48/Utils.git',
      'https://github.com/BasedAKP48/Utils',
      'https://github.com/BasedAKP48/Utils.git',
      'https://github.com/BasedAKP48/Utils/',
    ].forEach(value => expect(repositoryURL(value), 'to be', expected));
  });

  it('Should accept the object form', () => {
    expect(
      repositoryURL({ type: 'git', url: 'git+https://github.com/BasedAKP48/Utils.git', directory: 'x' }),
      'to be',
      'https://github.com/BasedAKP48/Utils',
    );
  });

  it('Should never keep credentials or a port', () => {
    expect(repositoryURL('https://user:token@github.com/a/b.git'), 'to be', 'https://github.com/a/b');
    expect(repositoryURL('ssh://git@example.com:2222/a/b.git'), 'to be', 'https://example.com/a/b');
  });

  it('Should return nothing for anything it cannot turn into a web address', () => {
    [undefined, null, '', '   ', 5, {}, { url: 5 }, 'not a repository', 'file:///tmp/repo',
      ['javascript', 'alert(1)'].join(':'), 'https://', 'a/b/c'].forEach((value) => {
      expect(repositoryURL(value), 'to be undefined');
    });
  });
});

describe('PresenceSystem registry info', () => {
  const connect = async (pkg) => {
    const db = createFakeRoot();
    PresenceSystem().initialize({ cid: 'p1', pkg, rootRef: db.root });
    db.emit('.info/connected', true);
    await new Promise(resolve => setImmediate(resolve));
    return db.get('registry/p1/info');
  };

  it('Should publish where the plugin lives', async () => {
    const info = await connect({
      name: 'pkg', version: '1.0.0', dependencies: {}, repository: 'BasedAKP48/Core',
    });

    expect(info, 'to satisfy', { pluginName: 'pkg', pluginRepository: 'https://github.com/BasedAKP48/Core' });
  });

  it('Should leave the field out when there is no repository', async () => {
    const info = await connect({ name: 'pkg', version: '1.0.0', dependencies: {} });

    expect(info, 'to satisfy', { pluginName: 'pkg' });
    expect(info, 'not to have key', 'pluginRepository');
  });
});
