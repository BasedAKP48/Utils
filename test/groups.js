const expect = require('unexpected');
const {
  commandUsage, groupCommands, parseCommand, subcommandName, validateCommands,
} = require('../index');

const command = (name, extra = {}) => ({ name, description: 'x', ...extra });
const names = list => list.map(item => item.command.name);

describe('command groups', () => {
  describe('validation', () => {
    const problems = definition => validateCommands({ 'voucher-buy': { description: 'x', ...definition } });

    it('Should accept a group, with a subcommand and a description of its own', () => {
      expect(problems({ group: 'voucher' }), 'to equal', []);
      expect(problems({ group: 'voucher', subcommand: 'buy', groupDescription: 'Buy vouchers' }), 'to equal', []);
    });

    it('Should need group and subcommand to be valid names', () => {
      ['Voucher', 'has space', '', 'x'.repeat(33), 5].forEach((group) => {
        expect(problems({ group }), 'to equal', ['command voucher-buy: group must be 1-32 lowercase letters, digits, - or _']);
      });
      expect(problems({ group: 'voucher', subcommand: 'Buy' }), 'to have length', 1);
    });

    it('Should need a description of 1 to 100 characters for the group', () => {
      expect(problems({ group: 'v', groupDescription: '' }), 'to equal', ['command voucher-buy: groupDescription must be 1-100 characters']);
      expect(problems({ group: 'v', groupDescription: 'x'.repeat(101) }), 'to have length', 1);
      expect(problems({ group: 'v', groupDescription: 'x'.repeat(100) }), 'to equal', []);
    });

    it('Should refuse a subcommand or a group description without a group', () => {
      expect(problems({ subcommand: 'buy' }), 'to equal', ['command voucher-buy: subcommand needs a group']);
      expect(problems({ groupDescription: 'x' }), 'to equal', ['command voucher-buy: groupDescription needs a group']);
    });
  });

  describe('subcommandName', () => {
    it('Should be nothing for a command without a group', () => {
      expect(subcommandName(command('balance')), 'to be undefined');
    });

    it('Should drop the name of the group from the name of the command', () => {
      expect(subcommandName(command('voucher-buy', { group: 'voucher' })), 'to be', 'buy');
      expect(subcommandName(command('voucher-my-codes', { group: 'voucher' })), 'to be', 'my-codes');
    });

    it('Should keep the whole name when it does not start with the group', () => {
      expect(subcommandName(command('feature-add', { group: 'bids' })), 'to be', 'feature-add');
      expect(subcommandName(command('voucher-', { group: 'voucher' })), 'to be', 'voucher-');
    });

    it('Should prefer the subcommand the definition names', () => {
      expect(subcommandName(command('voucher-buy', { group: 'voucher', subcommand: 'purchase' })), 'to be', 'purchase');
    });
  });

  describe('groupCommands', () => {
    it('Should leave commands without a group alone, and fold the others into groups', () => {
      const result = groupCommands([
        command('balance'),
        command('voucher-buy', { group: 'voucher', groupDescription: 'Buy vouchers' }),
        command('voucher-mine', { group: 'voucher' }),
        command('say'),
      ]);

      expect(result.standalone.map(item => item.name), 'to equal', ['balance', 'say']);
      expect(result.groups, 'to have length', 1);
      expect(result.groups[0].name, 'to be', 'voucher');
      expect(result.groups[0].description, 'to be', 'Buy vouchers');
      expect(result.groups[0].subcommands.map(item => item.name), 'to equal', ['buy', 'mine']);
      expect(names(result.groups[0].subcommands), 'to equal', ['voucher-buy', 'voucher-mine']);
      expect(result.conflicts, 'to equal', []);
    });

    it('Should use the first description it finds, and the name of the group without one', () => {
      const described = groupCommands([
        command('a-one', { group: 'a' }),
        command('a-two', { group: 'a', groupDescription: 'Second' }),
        command('a-three', { group: 'a', groupDescription: 'Third' }),
      ]);
      const bare = groupCommands([command('b-one', { group: 'b' })]);

      expect(described.groups[0].description, 'to be', 'Second');
      expect(bare.groups[0].description, 'to be', 'b');
    });

    it('Should bring commands of different plugins into one group', () => {
      const result = groupCommands([
        command('feature-add', { group: 'bids', cid: 'p1' }),
        command('bids-extra', { group: 'bids', cid: 'p2' }),
      ]);

      expect(result.groups[0].subcommands.map(item => item.name), 'to equal', ['feature-add', 'extra']);
    });

    it('Should keep the first of two subcommands with the same name, and report the other', () => {
      const result = groupCommands([
        command('voucher-buy', { group: 'voucher', cid: 'p1' }),
        command('voucher-purchase', { group: 'voucher', subcommand: 'buy', cid: 'p2' }),
      ]);

      expect(names(result.groups[0].subcommands), 'to equal', ['voucher-buy']);
      expect(result.conflicts, 'to equal', [
        { name: 'voucher-purchase', group: 'voucher', reason: 'the subcommand is already taken' },
      ]);
    });

    it('Should drop a group whose name is the name of a command, and report each of its commands', () => {
      const result = groupCommands([
        command('voucher'),
        command('voucher-buy', { group: 'voucher' }),
        command('voucher-mine', { group: 'voucher' }),
      ]);

      expect(result.groups, 'to equal', []);
      expect(result.standalone.map(item => item.name), 'to equal', ['voucher']);
      expect(result.conflicts.map(item => item.name), 'to equal', ['voucher-buy', 'voucher-mine']);
      expect(result.conflicts[0].reason, 'to be', 'a command has the name of the group');
    });

    it('Should keep at most 25 subcommands in a group, and report the rest', () => {
      const many = Array.from({ length: 27 }, (_, i) => command(`g-${i}`, { group: 'g' }));

      const result = groupCommands(many);

      expect(result.groups[0].subcommands, 'to have length', 25);
      expect(result.conflicts.map(item => item.name), 'to equal', ['g-25', 'g-26']);
      expect(result.conflicts[0].reason, 'to be', 'a group has at most 25 subcommands');
    });

    it('Should take any iterable, and give nothing for nothing', () => {
      expect(groupCommands(new Set([command('a')])).standalone, 'to have length', 1);
      expect(groupCommands([]), 'to equal', { standalone: [], groups: [], conflicts: [] });
    });

    it('Should keep the command objects as they are', () => {
      const original = command('voucher-buy', { group: 'voucher' });

      const result = groupCommands([original]);

      expect(result.groups[0].subcommands[0].command, 'to be', original);
    });
  });

  describe('typed text', () => {
    const list = [
      command('voucher-buy', { group: 'voucher', args: [{ name: 'plan', type: 'string', required: true }] }),
      command('voucher-mine', { group: 'voucher' }),
      command('balance', { aliases: ['wallet'], args: [{ name: 'currency', type: 'string' }] }),
      command('bid', { args: [{ name: 'amount', type: 'integer', required: true }] }),
    ];

    it('Should read the group and the subcommand as words, then the arguments', () => {
      const result = parseCommand('.voucher buy replay pro', list);

      expect(result.command.name, 'to be', 'voucher-buy');
      expect(result.args, 'to equal', { plan: 'replay pro' });
    });

    it('Should still read the whole name of the command', () => {
      const result = parseCommand('.voucher-buy replay pro', list);

      expect(result.command.name, 'to be', 'voucher-buy');
      expect(result.args, 'to equal', { plan: 'replay pro' });
    });

    it('Should not care about case or extra spaces', () => {
      const result = parseCommand('.VOUCHER   Mine', list);

      expect(result.command.name, 'to be', 'voucher-mine');
      expect(result.args, 'to equal', {});
    });

    it('Should say what is missing when the arguments are', () => {
      expect(parseCommand('.voucher buy', list), 'to satisfy', { problem: 'plan is required' });
    });

    it('Should not read a group word with an unknown subcommand as a command', () => {
      expect(parseCommand('.voucher refund', list), 'to be null');
      expect(parseCommand('.voucher', list), 'to be null');
    });

    it('Should leave commands without a group, and their aliases, as they were', () => {
      expect(parseCommand('.wallet gem', list).args, 'to equal', { currency: 'gem' });
      expect(parseCommand('.bid 5', list).args, 'to equal', { amount: 5 });
    });

    it('Should read the group form without a prefix when direct', () => {
      expect(parseCommand('voucher mine', list, { direct: true }).command.name, 'to be', 'voucher-mine');
    });

    it('Should not take a group word for a command when a command has that name', () => {
      const withClash = [command('voucher'), ...list];

      expect(parseCommand('.voucher', withClash).command.name, 'to be', 'voucher');
    });
  });

  describe('usage', () => {
    it('Should show the group form for a command in a group', () => {
      const buy = command('voucher-buy', {
        group: 'voucher', args: [{ name: 'plan', type: 'string', required: true }],
      });

      expect(commandUsage(buy), 'to be', '.voucher buy <plan>');
      expect(commandUsage(buy, '!'), 'to be', '!voucher buy <plan>');
    });

    it('Should show the name for a command without one', () => {
      expect(commandUsage(command('balance', { args: [{ name: 'c', type: 'string' }] })), 'to be', '.balance [c]');
    });
  });
});
