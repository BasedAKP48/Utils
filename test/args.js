const expect = require('unexpected');
const { filterChoices, parseCommand, validateCommands } = require('../index');
const commands = require('../lib/commands');
const createFakeRoot = require('./helpers/fakeRoot');

const arg = (overrides = {}) => ({
  name: 'n', description: 'd', type: 'string', ...overrides,
});
const problems = args => validateCommands({ a: { description: 'x', args } });
const read = (args, line) => parseCommand(`.x ${line}`, [{ name: 'x', args }]);
const choice = (name, value = name) => ({ name, value });
const many = count => Array.from({ length: count }, (_, i) => choice(`Plan ${i}`, `plan-${i}`));

describe('argument types', () => {
  it('Should accept every type', () => {
    ['string', 'integer', 'number', 'boolean', 'user', 'channel', 'role', 'mentionable', 'attachment'].forEach((type) => {
      expect(problems([arg({ type })]), 'to equal', []);
    });
  });

  it('Should refuse a type it does not know', () => {
    expect(problems([arg({ type: 'embed' })]), 'to have length', 1);
  });

  it('Should accept choices on numbers, and refuse them on types that cannot have any', () => {
    expect(problems([arg({ type: 'number', choices: [choice('Half', 0.5), choice('One', 1)] })]), 'to equal', []);
    expect(problems([arg({ type: 'number', choices: [choice('Bad', '1')] })]), 'to equal', [
      'command a: args[0]: choices[0]: value must be a number',
    ]);
    ['boolean', 'user', 'channel', 'role', 'mentionable', 'attachment'].forEach((type) => {
      expect(problems([arg({ type, choices: [choice('x')] })]), 'to equal', [
        'command a: args[0]: only string, integer and number args can have choices',
      ]);
    });
  });
});

describe('autocomplete', () => {
  it('Should accept a long list of choices to search, and only that', () => {
    expect(problems([arg({ autocomplete: true, choices: many(500) })]), 'to equal', []);
    expect(problems([arg({ autocomplete: true, choices: many(501) })]), 'to equal', ['command a: args[0]: at most 500 choices']);
    expect(problems([arg({ choices: many(26) })]), 'to equal', ['command a: args[0]: at most 25 choices']);
  });

  it('Should need the list, a boolean, and a type that can have choices', () => {
    expect(problems([arg({ autocomplete: true })]), 'to equal', ['command a: args[0]: autocomplete needs the list of choices to search']);
    expect(problems([arg({ autocomplete: true, choices: [] })]), 'to have length', 1);
    expect(problems([arg({ autocomplete: 'yes' })]), 'to equal', ['command a: args[0]: autocomplete must be a boolean']);
    expect(problems([arg({ type: 'user', autocomplete: true })]), 'to equal', [
      'command a: args[0]: only string, integer and number args can autocomplete',
    ]);
    expect(problems([arg({ autocomplete: false })]), 'to equal', []);
  });
});

describe('limits', () => {
  it('Should accept value limits on whole numbers and numbers', () => {
    expect(problems([arg({ type: 'integer', minValue: 1, maxValue: 10 })]), 'to equal', []);
    expect(problems([arg({ type: 'number', minValue: -0.5, maxValue: 2.5 })]), 'to equal', []);
    expect(problems([arg({ type: 'integer', minValue: 5, maxValue: 5 })]), 'to equal', []);
  });

  it('Should refuse value limits that are not numbers of that kind, or that are the wrong way round', () => {
    expect(problems([arg({ type: 'integer', minValue: 0.5 })]), 'to equal', ['command a: args[0]: minValue must be a whole number']);
    expect(problems([arg({ type: 'number', maxValue: 'big' })]), 'to equal', ['command a: args[0]: maxValue must be a number']);
    expect(problems([arg({ type: 'number', maxValue: Infinity })]), 'to have length', 1);
    expect(problems([arg({ type: 'integer', minValue: 5, maxValue: 1 })]), 'to equal', ['command a: args[0]: minValue cannot be more than maxValue']);
  });

  it('Should refuse value limits on anything else', () => {
    ['string', 'boolean', 'user'].forEach((type) => {
      expect(problems([arg({ type, minValue: 1 })]), 'to equal', ['command a: args[0]: minValue only apply to integer and number args']);
    });
  });

  it('Should accept length limits on text, from 0 and 1 up to 6000', () => {
    expect(problems([arg({ minLength: 0, maxLength: 6000 })]), 'to equal', []);
    expect(problems([arg({ minLength: 3, maxLength: 3 })]), 'to equal', []);
  });

  it('Should refuse length limits that are out of range, not whole, or the wrong way round', () => {
    expect(problems([arg({ minLength: -1 })]), 'to have length', 1);
    expect(problems([arg({ maxLength: 0 })]), 'to have length', 1);
    expect(problems([arg({ maxLength: 6001 })]), 'to have length', 1);
    expect(problems([arg({ minLength: 1.5 })]), 'to have length', 1);
    expect(problems([arg({ minLength: 9, maxLength: 3 })]), 'to equal', ['command a: args[0]: minLength cannot be more than maxLength']);
  });

  it('Should refuse length limits on anything but text', () => {
    expect(problems([arg({ type: 'integer', maxLength: 5 })]), 'to equal', ['command a: args[0]: maxLength only apply to string args']);
  });

  it('Should refuse limits together with choices, which Discord may not accept', () => {
    expect(problems([arg({ minLength: 1, choices: [choice('a')] })]), 'to equal', ['command a: args[0]: limits cannot be combined with choices']);
    expect(problems([arg({ type: 'integer', maxValue: 5, choices: [choice('One', 1)] })]), 'to have length', 1);
  });

  it('Should still name properties it does not know, such as the Discord spelling', () => {
    expect(problems([arg({ min_length: 1 })]), 'to equal', ['command a: args[0]: unknown property min_length']);
  });
});

describe('typed text', () => {
  describe('numbers', () => {
    it('Should read decimals and refuse the rest', () => {
      expect(read([arg({ type: 'number' })], '2.5'), 'to satisfy', { args: { n: 2.5 } });
      expect(read([arg({ type: 'number' })], '-3'), 'to satisfy', { args: { n: -3 } });
      expect(read([arg({ type: 'number' })], 'abc'), 'to satisfy', { problem: 'n must be a number' });
      expect(read([arg({ type: 'number' })], '1e5'), 'to satisfy', { problem: 'n must be a number' });
    });

    it('Should hold whole numbers and numbers to their limits', () => {
      const limited = [arg({ type: 'integer', minValue: 1, maxValue: 10 })];

      expect(read(limited, '5'), 'to satisfy', { args: { n: 5 } });
      expect(read(limited, '0'), 'to satisfy', { problem: 'n must be between 1 and 10' });
      expect(read(limited, '11'), 'to satisfy', { problem: 'n must be between 1 and 10' });
      expect(read([arg({ type: 'number', minValue: 0.5 })], '0.1'), 'to satisfy', { problem: 'n must be at least 0.5' });
      expect(read([arg({ type: 'number', maxValue: 2 })], '2.1'), 'to satisfy', { problem: 'n must be at most 2' });
    });
  });

  describe('text', () => {
    it('Should hold text to its length limits, for one argument or several', () => {
      expect(read([arg({ minLength: 3 })], 'ab'), 'to satisfy', { problem: 'n must be at least 3 characters' });
      expect(read([arg({ maxLength: 3 })], 'abcd'), 'to satisfy', { problem: 'n must be at most 3 characters' });
      expect(read([arg({ maxLength: 3 })], 'abc'), 'to satisfy', { args: { n: 'abc' } });
      const two = [arg({ name: 'a' }), arg({ name: 'b', maxLength: 2 })];
      expect(read(two, 'one | long'), 'to satisfy', { problem: 'b must be at most 2 characters' });
      expect(read(two, 'one | ok'), 'to satisfy', { args: { a: 'one', b: 'ok' } });
    });

    it('Should still say what is missing before it says what is wrong', () => {
      expect(read([arg({ required: true, minLength: 3 })], ''), 'to satisfy', { problem: 'n is required' });
    });
  });

  describe('mentions', () => {
    const ID = '123456789012345678';

    it('Should read users from a mention or an id', () => {
      const user = [arg({ type: 'user' })];

      expect(read(user, `<@${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read(user, `<@!${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read(user, ID), 'to satisfy', { args: { n: ID } });
      expect(read(user, 'alan'), 'to satisfy', { problem: 'n must be a user, as a mention or an id' });
      expect(read(user, `<#${ID}>`), 'to satisfy', { problem: 'n must be a user, as a mention or an id' });
    });

    it('Should read roles and channels from their own mentions', () => {
      expect(read([arg({ type: 'role' })], `<@&${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read([arg({ type: 'role' })], `<@${ID}>`), 'to satisfy', { problem: 'n must be a role, as a mention or an id' });
      expect(read([arg({ type: 'channel' })], `<#${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read([arg({ type: 'channel' })], `<@${ID}>`), 'to satisfy', { problem: 'n must be a channel, as a mention or an id' });
    });

    it('Should read either a user or a role for a mentionable', () => {
      const mentionable = [arg({ type: 'mentionable' })];

      expect(read(mentionable, `<@${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read(mentionable, `<@&${ID}>`), 'to satisfy', { args: { n: ID } });
      expect(read(mentionable, `<#${ID}>`), 'to satisfy', { problem: 'n must be a user or role, as a mention or an id' });
    });

    it('Should take one word for each, and go on to the next argument', () => {
      const args = [arg({ type: 'user' }), arg({ name: 'note', type: 'integer' })];

      expect(read(args, `<@${ID}> 5`), 'to satisfy', { args: { n: ID, note: 5 } });
    });
  });

  describe('attachments', () => {
    it('Should be refused when needed, since only the slash command can take one', () => {
      expect(read([arg({ type: 'attachment', required: true })], ''), 'to satisfy', {
        problem: 'n needs an attachment, which only the slash command can take',
      });
    });

    it('Should be skipped when optional, and later arguments still read', () => {
      const args = [arg({ name: 'file', type: 'attachment' }), arg({ name: 'count', type: 'integer' })];

      expect(read(args, '7'), 'to satisfy', { args: { count: 7 } });
    });
  });

  describe('choices', () => {
    const plan = [arg({ name: 'plan', choices: [choice('Replay Pro, 1 month', 'replay-pro'), choice('Badge', 'badge')] })];

    it('Should take a value or a name, in any case, and give back the value', () => {
      expect(read(plan, 'badge'), 'to satisfy', { args: { plan: 'badge' } });
      expect(read(plan, 'BADGE'), 'to satisfy', { args: { plan: 'badge' } });
      expect(read(plan, 'replay pro, 1 month'), 'to satisfy', { args: { plan: 'replay-pro' } });
      expect(read(plan, 'replay-pro'), 'to satisfy', { args: { plan: 'replay-pro' } });
    });

    it('Should refuse anything else, and list the names when there are few', () => {
      expect(read(plan, 'weekly'), 'to satisfy', { problem: 'plan must be one of: Replay Pro, 1 month, Badge' });
      expect(read([arg({ choices: many(25) })], 'nope').problem, 'to match', /^n must be one of: Plan 0, Plan 1/);
    });

    it('Should give back numbers for numeric choices, by number or by name', () => {
      const sizes = [arg({ name: 'size', type: 'integer', choices: [choice('Small', 1), choice('Large', 3)] })];

      expect(read(sizes, '3'), 'to satisfy', { args: { size: 3 } });
      expect(read(sizes, 'small'), 'to satisfy', { args: { size: 1 } });
      expect(read(sizes, '2'), 'to satisfy', { problem: 'size must be one of: Small, Large' });
    });

    it('Should not list a long list of names', () => {
      expect(read([arg({ autocomplete: true, choices: many(100) })], 'zzz'), 'to satisfy', { problem: 'n is not one of the choices' });
    });
  });

  describe('autocomplete lists', () => {
    const list = [arg({
      autocomplete: true,
      choices: [choice('Replay Pro, 1 month', 'replay-pro'), choice('Replay Plus', 'replay-plus'), choice('Badge', 'badge')],
    })];

    it('Should take an exact match first', () => {
      expect(read(list, 'badge'), 'to satisfy', { args: { n: 'badge' } });
    });

    it('Should take a part of a name when only one choice has it', () => {
      expect(read(list, 'badg'), 'to satisfy', { args: { n: 'badge' } });
      expect(read(list, 'pro'), 'to satisfy', { args: { n: 'replay-pro' } });
    });

    it('Should say which choices it could be when several have it, and when none do', () => {
      expect(read(list, 'replay'), 'to satisfy', { problem: 'n could be Replay Pro, 1 month, Replay Plus' });
      expect(read(list, 'zzz'), 'to satisfy', { problem: 'n must be one of: Replay Pro, 1 month, Replay Plus, Badge' });
    });
  });
});

describe('filterChoices', () => {
  const list = [choice('Replay Pro'), choice('Pro Badge', 'badge'), choice('Slot'), choice('Gold Slot', 'gold')];

  it('Should put names that start with the text before names that only contain it', () => {
    expect(filterChoices(list, 'pro').map(c => c.name), 'to equal', ['Pro Badge', 'Replay Pro']);
    expect(filterChoices(list, 'slot').map(c => c.name), 'to equal', ['Slot', 'Gold Slot']);
  });

  it('Should ignore case and look at the value too', () => {
    expect(filterChoices(list, 'BADGE').map(c => c.name), 'to equal', ['Pro Badge']);
    expect(filterChoices(list, 'gol').map(c => c.name), 'to equal', ['Gold Slot']);
  });

  it('Should give the first choices for no text, and at most the limit', () => {
    expect(filterChoices(list, '').map(c => c.name), 'to equal', ['Replay Pro', 'Pro Badge', 'Slot', 'Gold Slot']);
    expect(filterChoices(list, undefined, 2), 'to have length', 2);
    expect(filterChoices(many(100), '', undefined), 'to have length', 25);
    expect(filterChoices(many(100), 'plan', 10), 'to have length', 10);
  });

  it('Should give nothing when nothing matches, and not change the list', () => {
    const before = JSON.stringify(list);

    expect(filterChoices(list, 'zzz'), 'to equal', []);
    filterChoices(list, 'pro');

    expect(JSON.stringify(list), 'to be', before);
  });

  it('Should match numbers by their text', () => {
    expect(filterChoices([choice('Small', 1), choice('Large', 30)], '3').map(c => c.name), 'to equal', ['Large']);
  });
});

describe('publish and autocomplete', () => {
  const ref = db => db.root.child('config/p1/commands');
  const definition = (extra = {}) => ({
    list: { description: 'List', args: [arg({ name: 'plan', ...extra })] },
  });

  it('Should store the autocomplete flag of an argument that is already stored', async () => {
    const db = createFakeRoot({ config: { p1: { commands: definition() } } });

    await commands.publish(ref(db), definition({ autocomplete: true, choices: many(30) }));

    const stored = db.get('config/p1/commands/list').args[0];
    expect(stored.autocomplete, 'to be', true);
    expect(stored.choices, 'to have length', 30);
  });

  it('Should take the flag off when the plugin stops asking for it', async () => {
    const db = createFakeRoot({
      config: { p1: { commands: definition({ autocomplete: true, choices: many(30) }) } },
    });

    await commands.publish(ref(db), definition({ autocomplete: false, choices: many(3) }));

    const stored = db.get('config/p1/commands/list').args[0];
    expect('autocomplete' in stored, 'to be', false);
    expect(stored.choices, 'to have length', 3);
  });

  it('Should leave the flag alone when the definition does not mention it', async () => {
    const db = createFakeRoot({
      config: { p1: { commands: definition({ autocomplete: true, choices: many(30) }) } },
    });

    await commands.publish(ref(db), definition());

    expect(db.get('config/p1/commands/list').args[0].autocomplete, 'to be', true);
  });

  it('Should leave a command that is locked as it is', async () => {
    const stored = { ...definition({ choices: many(3) }).list, argLock: true };
    const db = createFakeRoot({ config: { p1: { commands: { list: stored } } } });

    await commands.publish(ref(db), definition({ autocomplete: true, choices: many(30) }));

    expect(db.get('config/p1/commands/list'), 'to equal', stored);
  });

  it('Should write nothing when it all matches already', async () => {
    const db = createFakeRoot({
      config: { p1: { commands: definition({ autocomplete: true, choices: many(30) }) } },
    });
    const before = JSON.stringify(db.data);

    await commands.publish(ref(db), definition({ autocomplete: true, choices: many(30) }));

    expect(JSON.stringify(db.data), 'to be', before);
  });
});
