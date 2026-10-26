const expect = require('unexpected');
const {
  allowedHere, collectCommands, commandGuilds, commandSettings,
} = require('../index');
const { applyDefaults, validateDefaults } = require('../lib/commandSettings');
const createFakeRoot = require('./helpers/fakeRoot');

const server = serverID => ({ data: { connectorType: 'discord', serverID, isPM: null } });
const direct = { data: { connectorType: 'discord', serverID: null, isPM: true } };

describe('validateDefaults', () => {
  it('Should accept neutral settings and per-connector objects', () => {
    expect(validateDefaults({
      enabled: true, private: false, discord: { guilds: ['1'] }, irc: {},
    }), 'to equal', []);
    expect(validateDefaults({}), 'to equal', []);
  });

  it('Should refuse anything else, naming it', () => {
    expect(validateDefaults({ enabled: 'yes' }), 'to equal', ['commandDefaults: enabled must be a boolean']);
    expect(validateDefaults({ private: 1 }), 'to have length', 1);
    expect(validateDefaults({ guilds: ['1'] }), 'to equal', ['commandDefaults: unknown property guilds']);
    expect(validateDefaults({ Discord: {} }), 'to have length', 1);
    expect(validateDefaults({ discord: 'text' }), 'to have length', 1);
  });

  it('Should refuse something that is not an object', () => {
    [null, undefined, [], 'text', 5].forEach((value) => {
      expect(validateDefaults(value), 'to have length', 1);
    });
  });
});

describe('applyDefaults', () => {
  it('Should fill in what a command does not set', () => {
    const merged = applyDefaults(
      { description: 'x' },
      { private: true, enabled: true, discord: { guilds: ['1'], dmPermission: false } },
    );

    expect(merged, 'to equal', {
      description: 'x', private: true, enabled: true, discord: { guilds: ['1'], dmPermission: false },
    });
  });

  it('Should let the command win, setting by setting', () => {
    const merged = applyDefaults(
      { description: 'x', private: false, discord: { guilds: ['2'] } },
      { private: true, discord: { guilds: ['1'], dmPermission: false } },
    );

    expect(merged.private, 'to be', false);
    expect(merged.discord, 'to equal', { guilds: ['2'], dmPermission: false });
  });

  it('Should replace a list instead of joining it', () => {
    const merged = applyDefaults({ discord: { guilds: ['2'] } }, { discord: { guilds: ['1', '3'] } });

    expect(merged.discord.guilds, 'to equal', ['2']);
  });

  it('Should never inherit a description, arguments or aliases', () => {
    const merged = applyDefaults({ description: 'x' }, { description: 'y', args: [], aliases: ['a'] });

    expect(merged, 'to equal', { description: 'x' });
  });

  it('Should leave the command untouched when there are no defaults', () => {
    const command = { description: 'x', discord: { guilds: ['1'] } };

    expect(applyDefaults(command, undefined), 'to equal', command);
    expect(applyDefaults(command, null), 'to equal', command);
    expect(applyDefaults(command, undefined), 'not to be', command);
  });

  it('Should allow a command to switch itself back on when everything is off', () => {
    const merged = applyDefaults({ description: 'x', enabled: true }, { enabled: false });

    expect(merged.enabled, 'to be', true);
  });
});

describe('commandSettings', () => {
  const config = {
    commands: { balance: { description: 'Balance', discord: { guilds: ['2'] } } },
    commandDefaults: { discord: { guilds: ['1'], dmPermission: false } },
  };

  it('Should merge a stored command with the plugin defaults', () => {
    expect(commandSettings(config, 'balance').discord, 'to equal', { guilds: ['2'], dmPermission: false });
  });

  it('Should fall back to the definitions in code before the command is stored', () => {
    const definitions = { other: { description: 'From code' } };

    expect(commandSettings(config, 'other', definitions), 'to satisfy', {
      description: 'From code', discord: { guilds: ['1'] },
    });
  });

  it('Should cope with a config that has nothing', () => {
    [undefined, null, {}, 'text'].forEach((value) => {
      expect(commandSettings(value, 'balance'), 'to equal', {});
    });
  });
});

describe('allowedHere', () => {
  const limited = { discord: { guilds: ['1', '2'] } };

  it('Should allow everything when nothing is configured', () => {
    expect(allowedHere({}, server('9')), 'to be', true);
    expect(allowedHere(undefined, server('9')), 'to be', true);
    expect(allowedHere({ description: 'x' }, direct), 'to be', true);
  });

  it('Should only allow the listed servers', () => {
    expect(allowedHere(limited, server('1')), 'to be', true);
    expect(allowedHere(limited, server('2')), 'to be', true);
    expect(allowedHere(limited, server('3')), 'to be', false);
  });

  it('Should treat ids as text, however the database stored them', () => {
    expect(allowedHere({ discord: { guilds: [1] } }, server('1')), 'to be', true);
    expect(allowedHere({ discord: { guilds: { 0: '1' } } }, server('1')), 'to be', true);
  });

  it('Should let a star mean every server', () => {
    expect(allowedHere({ discord: { guilds: ['*'] } }, server('77')), 'to be', true);
  });

  it('Should keep direct messages allowed unless they are switched off', () => {
    expect(allowedHere(limited, direct), 'to be', true);
    expect(allowedHere({ discord: { guilds: ['1'], dmPermission: false } }, direct), 'to be', false);
    expect(allowedHere({ discord: { dmPermission: false } }, server('5')), 'to be', true);
  });

  it('Should refuse everything for a disabled command', () => {
    expect(allowedHere({ enabled: false }, server('1')), 'to be', false);
    expect(allowedHere({ enabled: false }, direct), 'to be', false);
  });

  it('Should not apply discord settings to another connector', () => {
    const irc = { data: { connectorType: 'irc' } };

    expect(allowedHere({ discord: { guilds: ['1'], dmPermission: false } }, irc), 'to be', true);
  });

  it('Should cope with a message that has no data', () => {
    expect(allowedHere(limited, {}), 'to be', true);
    expect(allowedHere({ discord: { dmPermission: false } }, undefined), 'to be', true);
  });
});

describe('commandGuilds', () => {
  it('Should list the servers a command is limited to', () => {
    expect(commandGuilds({ discord: { guilds: ['1', 2] } }), 'to equal', ['1', '2']);
  });

  it('Should be empty for a command that is not limited, or is for every server', () => {
    expect(commandGuilds({}), 'to equal', []);
    expect(commandGuilds({ discord: {} }), 'to equal', []);
    expect(commandGuilds({ discord: { guilds: ['*'] } }), 'to equal', []);
    expect(commandGuilds({ discord: { guilds: ['1', '*'] } }), 'to equal', []);
    expect(commandGuilds(undefined), 'to equal', []);
  });
});

describe('collect with defaults', () => {
  const entry = cid => ({
    info: { pluginName: `@basedakp48/${cid}`, instanceName: cid, listenMode: 'normal' },
    presence: { connected: true },
  });
  const command = (extra = {}) => ({ description: 'A command', ...extra });

  it('Should merge the plugin defaults into each of its commands', async () => {
    const db = createFakeRoot({
      registry: { p1: entry('p1') },
      config: {
        p1: {
          commandDefaults: { private: true, discord: { guilds: ['1'] } },
          commands: { a: command(), b: command({ private: false, discord: { guilds: ['2'] } }) },
        },
      },
    });

    const { commands } = await collectCommands(db.root);
    const byName = Object.fromEntries(commands.map(c => [c.name, c]));

    expect(byName.a, 'to satisfy', { private: true, discord: { guilds: ['1'] } });
    expect(byName.b, 'to satisfy', { private: false, discord: { guilds: ['2'] } });
  });

  it('Should keep one plugin\'s defaults away from another plugin', async () => {
    const db = createFakeRoot({
      registry: { p1: entry('p1'), p2: entry('p2') },
      config: {
        p1: { commandDefaults: { discord: { guilds: ['1'] } }, commands: { a: command() } },
        p2: { commands: { b: command() } },
      },
    });

    const { commands } = await collectCommands(db.root);

    expect(commands.find(c => c.name === 'a').discord, 'to equal', { guilds: ['1'] });
    expect(commands.find(c => c.name === 'b'), 'not to have key', 'discord');
  });

  it('Should switch off every command of a plugin, except one that opts back in', async () => {
    const db = createFakeRoot({
      registry: { p1: entry('p1') },
      config: {
        p1: {
          commandDefaults: { enabled: false },
          commands: { a: command(), b: command({ enabled: true }) },
        },
      },
    });

    expect((await collectCommands(db.root)).commands.map(c => c.name), 'to equal', ['b']);
  });

  it('Should report bad defaults and carry on without them', async () => {
    const db = createFakeRoot({
      registry: { p1: entry('p1') },
      config: {
        p1: { commandDefaults: { enabled: 'no', guilds: ['1'] }, commands: { a: command() } },
      },
    });

    const result = await collectCommands(db.root);

    expect(result.commands.map(c => c.name), 'to equal', ['a']);
    expect(result.commands[0], 'not to have key', 'discord');
    expect(result.invalid, 'to satisfy', [{ cid: 'p1', name: 'commandDefaults' }]);
    expect(result.invalid[0].problems, 'to have length', 2);
  });

  it('Should work exactly as before for a plugin with no defaults', async () => {
    const db = createFakeRoot({
      registry: { p1: entry('p1') },
      config: { p1: { commands: { a: command() } } },
    });

    const { commands, invalid } = await collectCommands(db.root);

    expect(commands, 'to have length', 1);
    expect(invalid, 'to equal', []);
  });
});
