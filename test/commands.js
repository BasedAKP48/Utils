const expect = require('unexpected');
const {
  Module, collectCommands, commandUsage, parseCommand, validateCommands,
} = require('../index');
const commands = require('../lib/commands');
const createFakeRoot = require('./helpers/fakeRoot');

const good = {
  balance: {
    description: 'Check your wallet balance',
    aliases: ['wallet'],
    private: true,
    args: [
      {
        name: 'currency', description: 'Which currency', type: 'string', required: false,
      },
    ],
    discord: { dmPermission: true },
  },
};

describe('commands', () => {
  describe('text arguments', () => {
    const arg = (name, type, required) => ({
      name, description: 'x', type, required,
    });
    const define = args => ({ x: { description: 'x', args } });

    it('Should accept text arguments at the end', () => {
      expect(validateCommands(define([arg('id', 'integer', true), arg('a', 'string'), arg('b', 'string')])), 'to equal', []);
    });

    it('Should refuse an argument after a text argument', () => {
      expect(validateCommands(define([arg('a', 'string'), arg('n', 'integer')])), 'to equal', [
        'command x: args[1]: text args must come last',
      ]);
    });
  });

  describe('parseCommand', () => {
    const list = [
      {
        name: 'bid',
        aliases: ['offer'],
        args: [
          { name: 'id', type: 'integer', required: true },
          { name: 'amount', type: 'integer', required: true },
          { name: 'hidden', type: 'boolean' },
        ],
      },
      {
        name: 'add',
        args: [
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string' },
        ],
      },
      {
        name: 'edit',
        args: [
          { name: 'id', type: 'integer', required: true },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
        ],
      },
      { name: 'ping' },
    ];
    const read = (text, options) => {
      const parsed = parseCommand(text, list, options);
      return parsed && { name: parsed.command.name, args: parsed.args, problem: parsed.problem };
    };

    it('Should convert whole numbers and yes or no words', () => {
      expect(read('.bid 12 500 hidden'), 'to equal', { name: 'bid', args: { id: 12, amount: 500, hidden: true }, problem: undefined });
      expect(read('.bid 12 500 no').args, 'to equal', { id: 12, amount: 500, hidden: false });
      expect(read('.bid 12 500').args, 'to equal', { id: 12, amount: 500 });
    });

    it('Should find a command by alias, in any case, with space after the prefix', () => {
      expect(read('.OFFER 1 2').name, 'to be', 'bid');
      expect(read('. bid 1 2').name, 'to be', 'bid');
    });

    it('Should need the prefix unless it is direct', () => {
      expect(read('bid 1 2'), 'to be null');
      expect(read('bid 1 2', { direct: true }).name, 'to be', 'bid');
      expect(read('!bid 1 2', { prefix: '!' }).name, 'to be', 'bid');
      expect(read('.bid 1 2', { prefix: '!' }), 'to be null');
    });

    it('Should ignore text that is not a command', () => {
      ['.say hi', 'hello .bid', '.', '', '.bids', '.constructor', '.__proto__', null, undefined].forEach((text) => {
        expect(read(text), 'to be null');
      });
    });

    it('Should say what is wrong with an argument', () => {
      expect(read('.bid abc 5').problem, 'to be', 'id must be a whole number');
      expect(read('.bid 1 5.5').problem, 'to be', 'amount must be a whole number');
      expect(read(`.bid 1 ${'9'.repeat(30)}`).problem, 'to be', 'amount must be a whole number');
      expect(read('.bid 1 5 maybe').problem, 'to be', 'hidden must be yes or no');
      expect(read('.bid 1').problem, 'to be', 'amount is required');
      expect(read('.bid').problem, 'to be', 'id is required');
      expect(read('.add   ').problem, 'to be', 'title is required');
    });

    it('Should accept a negative whole number and let the plugin judge it', () => {
      expect(read('.bid 1 -50').args, 'to equal', { id: 1, amount: -50 });
    });

    it('Should give a lone text argument the rest of the line', () => {
      expect(read('.add Dark mode | for night owls').args, 'to equal', { title: 'Dark mode', description: 'for night owls' });
      expect(read('.add   Dark   mode ').args, 'to equal', { title: 'Dark   mode' });
    });

    it('Should keep an empty slot when a later text argument is given', () => {
      expect(read('.edit 3 | only this').args, 'to equal', { id: 3, description: 'only this' });
      expect(read('.edit 3 New title').args, 'to equal', { id: 3, title: 'New title' });
      expect(read('.edit 3 New title | and this | and a bar').args, 'to equal', {
        id: 3, title: 'New title', description: 'and this | and a bar',
      });
      expect(read('.edit 3').args, 'to equal', { id: 3 });
    });

    it('Should leave a command without arguments alone', () => {
      expect(read('.ping now').args, 'to equal', {});
    });
  });

  describe('commandUsage', () => {
    it('Should show required arguments in angle brackets and the rest in square brackets', () => {
      const command = {
        name: 'bid',
        args: [
          { name: 'id', type: 'integer', required: true },
          { name: 'hidden', type: 'boolean' },
        ],
      };
      expect(commandUsage(command), 'to be', '.bid <id> [hidden]');
      expect(commandUsage(command, '!'), 'to be', '!bid <id> [hidden]');
      expect(commandUsage({ name: 'ping' }), 'to be', '.ping');
    });

    it('Should put a bar between text arguments', () => {
      const command = {
        name: 'add',
        args: [{ name: 'title', type: 'string', required: true }, { name: 'description', type: 'string' }],
      };
      expect(commandUsage(command), 'to be', '.add <title> | [description]');
    });
  });

  describe('validate', () => {
    it('Should accept a complete definition', () => expect(validateCommands(good), 'to equal', []));

    it('Should accept an empty set', () => expect(validateCommands({}), 'to equal', []));

    it('Should require an object keyed by name', () => {
      [null, undefined, [], 'balance', 5].forEach((value) => {
        expect(validateCommands(value), 'to have length', 1);
      });
    });

    it('Should refuse names that Discord and the database cannot use', () => {
      ['Balance', 'has space', '', 'a'.repeat(33), 'dot.name', 'slash/name'].forEach((name) => {
        expect(validateCommands({ [name]: { description: 'x' } }), 'not to equal', []);
      });
      expect(validateCommands({ 'a-b_c9': { description: 'x' } }), 'to equal', []);
    });

    it('Should require a description of 1-100 characters', () => {
      [undefined, '', '   ', 5, 'x'.repeat(101)].forEach((description) => {
        expect(validateCommands({ a: { description } }), 'to have length', 1);
      });
      expect(validateCommands({ a: { description: 'x'.repeat(100) } }), 'to equal', []);
    });

    it('Should check aliases', () => {
      expect(validateCommands({ a: { description: 'x', aliases: ['ok', 'also-ok'] } }), 'to equal', []);
      expect(validateCommands({ a: { description: 'x', aliases: 'wallet' } }), 'to have length', 1);
      expect(validateCommands({ a: { description: 'x', aliases: ['Bad Alias'] } }), 'to have length', 1);
    });

    it('Should check args', () => {
      const arg = (overrides = {}) => ({
        name: 'n', description: 'd', type: 'string', ...overrides,
      });
      const problems = args => validateCommands({ a: { description: 'x', args } });

      expect(problems([arg({ name: 'm', type: 'integer' }), arg({ name: 'o', type: 'boolean' }), arg()]), 'to equal', []);
      expect(problems('nope'), 'to have length', 1);
      expect(problems([arg({ type: 'user' })]), 'to have length', 1);
      expect(problems([arg({ name: 'Bad' })]), 'to have length', 1);
      expect(problems([arg({ description: '' })]), 'to have length', 1);
      expect(problems([arg(), arg()]), 'to have length', 1);
      expect(problems([arg({ required: 'yes' })]), 'to have length', 1);
      expect(problems([arg({ extra: true })]), 'to have length', 1);
      expect(problems(Array.from({ length: 26 }, (_, i) => arg({ name: `n${i}` }))), 'to have length', 1);
    });

    it('Should put required args before optional ones', () => {
      const optional = { name: 'a', description: 'd', type: 'string' };
      const required = {
        name: 'b', description: 'd', type: 'string', required: true,
      };

      expect(validateCommands({ c: { description: 'x', args: [required, optional] } }), 'to equal', []);
      expect(validateCommands({ c: { description: 'x', args: [optional, required] } }), 'to have length', 1);
    });

    it('Should require booleans for private and enabled', () => {
      expect(validateCommands({ a: { description: 'x', private: 'true' } }), 'to have length', 1);
      expect(validateCommands({ a: { description: 'x', enabled: 1 } }), 'to have length', 1);
      expect(validateCommands({ a: { description: 'x', private: false, enabled: false } }), 'to equal', []);
    });

    it('Should refuse unknown properties but allow per-connector objects', () => {
      expect(validateCommands({ a: { description: 'x', ephemeral: true } }), 'to equal', ['command a: unknown property ephemeral']);
      expect(validateCommands({ a: { description: 'x', discord: { any: 'thing' }, irc: {} } }), 'to equal', []);
      expect(validateCommands({ a: { description: 'x', discord: 'text' } }), 'to have length', 1);
    });
  });

  describe('assertValid', () => {
    it('Should throw, listing every problem', () => {
      expect(() => commands.assertValid({ A: {}, b: { description: '' } }), 'to throw', /Invalid commands:[\s\S]*A[\s\S]*command b/);
    });

    it('Should return quietly for good definitions', () => expect(() => commands.assertValid(good), 'not to throw'));
  });

  describe('publish', () => {
    const ref = db => db.root.child('config/p1/commands');

    it('Should write every missing command', async () => {
      const db = createFakeRoot();

      await commands.publish(ref(db), { ...good, say: { description: 'Say text' } });

      expect(db.get('config/p1/commands/balance'), 'to equal', good.balance);
      expect(db.get('config/p1/commands/say'), 'to equal', { description: 'Say text' });
    });

    it('Should never overwrite what is already stored', async () => {
      const edited = { description: 'Edited by an admin', enabled: false };
      const db = createFakeRoot({ config: { p1: { commands: { balance: edited } } } });

      await commands.publish(ref(db), { ...good, say: { description: 'Say text' } });

      expect(db.get('config/p1/commands/balance'), 'to equal', edited);
      expect(db.get('config/p1/commands/say'), 'to equal', { description: 'Say text' });
    });

    it('Should leave other config and other commands alone', async () => {
      const db = createFakeRoot({ config: { p1: { token: 'secret', commands: { old: { description: 'Old' } } } } });

      await commands.publish(ref(db), good);

      expect(db.get('config/p1/token'), 'to be', 'secret');
      expect(db.get('config/p1/commands/old'), 'to equal', { description: 'Old' });
    });

    it('Should be safe to run again', async () => {
      const db = createFakeRoot();

      await commands.publish(ref(db), good);
      const first = JSON.stringify(db.data);
      await commands.publish(ref(db), good);

      expect(JSON.stringify(db.data), 'to be', first);
    });

    it('Should not store the caller\'s object by reference', async () => {
      const db = createFakeRoot();
      const mine = { description: 'Mine', args: [] };

      await commands.publish(ref(db), { mine });
      mine.description = 'Changed afterwards';

      expect(db.get('config/p1/commands/mine').description, 'to be', 'Mine');
    });
  });

  describe('collect', () => {
    const entry = (cid, overrides = {}) => ({
      info: { pluginName: `@basedakp48/${cid}`, instanceName: `${cid} instance`, listenMode: 'normal' },
      presence: { connected: true },
      ...overrides,
    });
    const command = (description = 'A command', extra = {}) => ({ description, ...extra });

    it('Should return the commands of every plugin in the registry', async () => {
      const db = createFakeRoot({
        registry: { p1: entry('p1'), p2: entry('p2') },
        config: {
          p1: { commands: { balance: command('Balance') } },
          p2: { commands: { say: command('Say') } },
        },
      });

      const result = await collectCommands(db.root);

      expect(result.commands.map(c => `${c.cid}:${c.name}`).sort(), 'to equal', ['p1:balance', 'p2:say']);
      expect(result.conflicts, 'to equal', []);
      expect(result.invalid, 'to equal', []);
      expect(result.commands.find(c => c.name === 'balance'), 'to satisfy', {
        cid: 'p1', plugin: '@basedakp48/p1', instance: 'p1 instance', online: true, description: 'Balance',
      });
    });

    it('Should skip disabled commands', async () => {
      const db = createFakeRoot({
        registry: { p1: entry('p1') },
        config: { p1: { commands: { on: command('On'), off: command('Off', { enabled: false }) } } },
      });

      expect((await collectCommands(db.root)).commands.map(c => c.name), 'to equal', ['on']);
    });

    it('Should report invalid definitions without dropping the good ones', async () => {
      const db = createFakeRoot({
        registry: { p1: entry('p1') },
        config: { p1: { commands: { good: command('Good'), Bad: command('Bad'), worse: { description: '' } } } },
      });

      const result = await collectCommands(db.root);

      expect(result.commands.map(c => c.name), 'to equal', ['good']);
      expect(result.invalid.map(i => i.name).sort(), 'to equal', ['Bad', 'worse']);
      expect(result.invalid[0].problems, 'not to be empty');
    });

    it('Should keep marking offline plugins and prefer online ones on a name clash', async () => {
      const db = createFakeRoot({
        registry: {
          a: entry('a', { presence: { connected: false } }),
          b: entry('b'),
          c: entry('c'),
        },
        config: {
          a: { commands: { clash: command('From a'), solo: command('Solo') } },
          b: { commands: { clash: command('From b') } },
          c: { commands: { clash: command('From c') } },
        },
      });

      const result = await collectCommands(db.root);

      expect(result.commands.find(c => c.name === 'clash').cid, 'to be', 'b');
      expect(result.conflicts, 'to equal', [
        { name: 'clash', cid: 'c', winner: 'b' },
        { name: 'clash', cid: 'a', winner: 'b' },
      ]);
      expect(result.commands.find(c => c.name === 'solo'), 'to satisfy', { cid: 'a', online: false });
    });

    it('Should only read each plugin\'s commands, never its whole config', async () => {
      const db = createFakeRoot({
        registry: { p1: entry('p1') },
        config: { p1: { token: 'secret', commands: { x: command('X') } } },
      });

      await collectCommands(db.root);

      expect(db.reads.sort(), 'to equal', ['config/p1/commandDefaults', 'config/p1/commands', 'registry']);
      expect(db.reads, 'not to contain', 'config/p1');
      expect(db.reads, 'not to contain', 'config');
    });

    it('Should ignore registry entries without info and plugins without commands', async () => {
      const db = createFakeRoot({
        registry: { stale: { presence: { connected: false } }, p1: entry('p1'), p2: entry('p2') },
        config: { p1: { token: 'secret' } },
      });

      const result = await collectCommands(db.root);

      expect(result, 'to equal', { commands: [], conflicts: [], invalid: [] });
      expect(db.reads, 'not to contain', 'config/stale/commands');
    });

    it('Should cope with an empty database', async () => {
      expect(await collectCommands(createFakeRoot().root), 'to equal', { commands: [], conflicts: [], invalid: [] });
    });
  });

  describe('Module#defaultCommands', () => {
    const create = (db, options = {}) => new Module({
      type: 'plugin', root: db.root, cid: 'p1', pkg: {}, useBasicConfig: false, ...options,
    });
    const settle = () => new Promise(resolve => setImmediate(resolve));

    it('Should refuse invalid definitions immediately', () => {
      const m = create(createFakeRoot());

      expect(() => m.defaultCommands({ Bad: {} }), 'to throw', /Invalid commands/);
    });

    it('Should publish once Firebase reports it is connected', async () => {
      const db = createFakeRoot();
      const m = create(db);

      m.defaultCommands(good);
      await settle();
      expect(db.get('config/p1/commands'), 'to be null');

      db.emit('.info/connected', false);
      await settle();
      expect(db.get('config/p1/commands'), 'to be null');

      db.emit('.info/connected', true);
      await settle();
      expect(db.get('config/p1/commands/balance'), 'to equal', good.balance);
    });

    it('Should not overwrite edits when it reconnects', async () => {
      const db = createFakeRoot();
      const m = create(db);
      m.defaultCommands(good);

      db.emit('.info/connected', true);
      await settle();
      db.root.child('config/p1/commands/balance').transaction(() => ({ description: 'Edited', enabled: false }));
      db.emit('.info/connected', false);
      db.emit('.info/connected', true);
      await settle();

      expect(db.get('config/p1/commands/balance'), 'to equal', { description: 'Edited', enabled: false });
    });
  });
});
