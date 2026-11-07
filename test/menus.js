const expect = require('unexpected');
const {
  collectCommands, contextMenus, groupCommands, menuName, parseCommand, validateCommands,
} = require('../index');
const createFakeRoot = require('./helpers/fakeRoot');

const arg = (overrides = {}) => ({
  name: 'target', description: 'Who or what', type: 'user', ...overrides,
});
const command = (name, extra = {}) => ({ name, description: 'x', ...extra });
const problems = definition => validateCommands({
  'voucher-mine': { description: 'x', args: [arg()], ...definition },
});

describe('context menus', () => {
  describe('validation', () => {
    it('Should accept a user menu that fills a user arg, and a message menu that fills a text arg', () => {
      expect(problems({ context: { type: 'user', arg: 'target' } }), 'to equal', []);
      expect(problems({
        args: [arg({ name: 'text', type: 'string' })],
        context: { type: 'message', arg: 'text' },
      }), 'to equal', []);
    });

    it('Should accept a name of its own, with capitals, spaces and other characters', () => {
      expect(problems({ context: { type: 'user', arg: 'target', name: 'Show vouchers 🎟' } }), 'to equal', []);
      expect(problems({ context: { type: 'user', arg: 'target', name: 'x'.repeat(32) } }), 'to equal', []);
    });

    it('Should accept other args as long as they are optional', () => {
      expect(problems({
        args: [arg(), arg({ name: 'n', type: 'integer', required: false }), arg({ name: 'note', type: 'string' })],
        context: { type: 'user', arg: 'target' },
      }), 'to equal', []);
    });

    it('Should accept a required target arg, since a menu always has the target', () => {
      expect(problems({ args: [arg({ required: true })], context: { type: 'user', arg: 'target' } }), 'to equal', []);
    });

    it('Should need a context that is an object with a known type', () => {
      expect(problems({ context: 'user' }), 'to equal', ['command voucher-mine: context must be an object']);
      expect(problems({ context: [] }), 'to equal', ['command voucher-mine: context must be an object']);
      expect(problems({ context: { type: 'channel', arg: 'target' } }), 'to equal', [
        'command voucher-mine: context.type must be one of user, message',
      ]);
      expect(problems({ context: { arg: 'target' } }), 'to have length', 1);
    });

    it('Should need the arg to be one the command has, of the type the menu fills', () => {
      expect(problems({ context: { type: 'user' } }), 'to equal', ['command voucher-mine: context.arg must name one of the args']);
      expect(problems({ context: { type: 'user', arg: 'other' } }), 'to equal', ['command voucher-mine: context.arg must name one of the args']);
      expect(problems({ args: undefined, context: { type: 'user', arg: 'target' } }), 'to have length', 1);
      expect(problems({ args: [arg({ type: 'string' })], context: { type: 'user', arg: 'target' } }), 'to equal', [
        'command voucher-mine: context.arg must be a user arg for a user menu',
      ]);
      expect(problems({ context: { type: 'message', arg: 'target' } }), 'to equal', [
        'command voucher-mine: context.arg must be a string arg for a message menu',
      ]);
    });

    it('Should refuse a required arg that a menu cannot ask for', () => {
      expect(problems({
        args: [arg({ required: true }), arg({ name: 'note', type: 'string', required: true })],
        context: { type: 'user', arg: 'target' },
      }), 'to equal', ['command voucher-mine: note must be optional, since a menu cannot ask for it']);
    });

    it('Should refuse a name that is empty, too long, or not text', () => {
      ['', '   ', 'x'.repeat(33), 5, 'two\nlines', 'tab\there'].forEach((name) => {
        expect(problems({ context: { type: 'user', arg: 'target', name } }), 'to equal', [
          'command voucher-mine: context.name must be 1-32 characters',
        ]);
      });
    });

    it('Should refuse properties it does not know', () => {
      expect(problems({ context: { type: 'user', arg: 'target', guild: '1' } }), 'to equal', [
        'command voucher-mine: context has an unknown property guild',
      ]);
    });

    it('Should not take context for the settings of a connector', () => {
      expect(problems({ context: { any: 'thing' } }), 'to have length', 3);
    });
  });

  describe('menuName', () => {
    it('Should be the name of the command, in words', () => {
      expect(menuName(command('voucher-mine', { context: { type: 'user', arg: 'a' } })), 'to be', 'Voucher mine');
      expect(menuName(command('show_user_codes', { context: { type: 'user', arg: 'a' } })), 'to be', 'Show user codes');
      expect(menuName(command('balance')), 'to be', 'Balance');
    });

    it('Should be the name the definition gives, trimmed', () => {
      expect(menuName(command('voucher-mine', { context: { type: 'user', arg: 'a', name: '  Show vouchers ' } })), 'to be', 'Show vouchers');
    });

    it('Should fall back to the name of the command when the given one is no good', () => {
      expect(menuName(command('voucher-mine', { context: { type: 'user', arg: 'a', name: '' } })), 'to be', 'Voucher mine');
    });
  });

  describe('contextMenus', () => {
    const user = (name, extra = {}) => command(name, { context: { type: 'user', arg: 'target', ...extra } });
    const message = (name, extra = {}) => command(name, { context: { type: 'message', arg: 'text', ...extra } });

    it('Should sort the commands that have a context into user and message menus', () => {
      const result = contextMenus([
        command('balance'),
        user('voucher-mine'),
        message('remind-me', { name: 'Remind me of this' }),
        command('say'),
      ]);

      expect(result.user.map(item => item.name), 'to equal', ['Voucher mine']);
      expect(result.user[0].arg, 'to be', 'target');
      expect(result.user[0].command.name, 'to be', 'voucher-mine');
      expect(result.message.map(item => item.name), 'to equal', ['Remind me of this']);
      expect(result.message[0].arg, 'to be', 'text');
      expect(result.conflicts, 'to equal', []);
    });

    it('Should keep the first of two menus with the same name, whatever the case, and report the other', () => {
      const result = contextMenus([user('a', { name: 'Show' }), user('b', { name: 'SHOW' }), message('c', { name: 'Show' })]);

      expect(result.user.map(item => item.command.name), 'to equal', ['a']);
      expect(result.message.map(item => item.command.name), 'to equal', ['c']);
      expect(result.conflicts, 'to equal', [{ name: 'b', type: 'user', reason: 'the menu name is already taken' }]);
    });

    it('Should keep at most five menus of each type, and report the rest', () => {
      const many = Array.from({ length: 7 }, (_, i) => user(`u${i}`));

      const result = contextMenus([...many, message('m')]);

      expect(result.user, 'to have length', 5);
      expect(result.message, 'to have length', 1);
      expect(result.conflicts.map(item => item.name), 'to equal', ['u5', 'u6']);
      expect(result.conflicts[0].reason, 'to be', 'there are at most 5 user menu commands');
    });

    it('Should skip a context with a type it does not know, take any iterable, and give nothing for nothing', () => {
      expect(contextMenus([command('a', { context: { type: 'channel', arg: 'x' } })]).conflicts, 'to equal', []);
      expect(contextMenus(new Set([user('a')])).user, 'to have length', 1);
      expect(contextMenus([]), 'to equal', { user: [], message: [], conflicts: [] });
    });

    it('Should keep the command objects as they are', () => {
      const original = user('voucher-mine');

      expect(contextMenus([original]).user[0].command, 'to be', original);
    });
  });

  describe('a command that is also a subcommand', () => {
    const stored = {
      description: 'Show vouchers',
      group: 'voucher',
      args: [arg()],
      context: { type: 'user', arg: 'target' },
    };
    const mine = { name: 'voucher-mine', ...stored };

    it('Should be valid, with the menu and the subcommand as two ways to run the one command', () => {
      expect(validateCommands({ 'voucher-mine': stored }), 'to equal', []);
    });

    it('Should have a menu of its own, named from the whole command name and not from the group', () => {
      const { user } = contextMenus([mine]);

      expect(user.map(item => item.name), 'to equal', ['Voucher mine']);
      expect(user[0].command, 'to be', mine);
    });

    it('Should keep its menu when its group is dropped', () => {
      const clash = [command('voucher'), mine];

      expect(groupCommands(clash).groups, 'to equal', []);
      expect(contextMenus(clash).user.map(item => item.command.name), 'to equal', ['voucher-mine']);
    });

    it('Should still be typed as part of its group', () => {
      expect(parseCommand('.voucher mine <@123456789012345678>', [mine]).command.name, 'to be', 'voucher-mine');
    });
  });

  describe('typed text and collecting', () => {
    const entry = cid => ({
      info: { pluginName: `@basedakp48/${cid}`, instanceName: cid, listenMode: 'normal' },
      presence: { connected: true },
    });

    it('Should leave a command with a context working as a typed command', () => {
      const list = [command('voucher-mine', { args: [arg()], context: { type: 'user', arg: 'target' } })];

      expect(parseCommand('.voucher-mine <@123456789012345678>', list).args, 'to equal', { target: '123456789012345678' });
    });

    it('Should keep a stored command with a good context, and report one with a bad context', async () => {
      const db = createFakeRoot({
        registry: { p1: entry('p1') },
        config: {
          p1: {
            commands: {
              good: { description: 'x', args: [arg()], context: { type: 'user', arg: 'target' } },
              bad: { description: 'x', args: [arg()], context: { type: 'user', arg: 'missing' } },
            },
          },
        },
      });

      const result = await collectCommands(db.root);

      expect(result.commands.map(item => item.name), 'to equal', ['good']);
      expect(result.invalid.map(item => item.name), 'to equal', ['bad']);
      expect(result.invalid[0].problems, 'to equal', ['command bad: context.arg must name one of the args']);
    });
  });
});
