const expect = require('unexpected');
const {
  buildComponents, componentCustomId, parseComponentCustomId, validateComponents,
} = require('../index');

const action = (overrides = {}) => ({ id: 'confirm', label: 'Confirm', ...overrides });
const link = (overrides = {}) => ({ url: 'https://example.test/redeem', label: 'Redeem', ...overrides });
const problems = input => validateComponents(input);

describe('validateComponents', () => {
  it('Should accept a flat list of buttons, or a list of rows', () => {
    expect(problems([action(), action({ id: 'cancel', style: 'danger' })]), 'to equal', []);
    expect(problems([[action()], [action({ id: 'b' }), link()]]), 'to equal', []);
  });

  it('Should accept an empty list, which takes the buttons off a message', () => {
    expect(problems([]), 'to equal', []);
  });

  it('Should accept every style, a disabled button, and the limits', () => {
    ['primary', 'secondary', 'success', 'danger'].forEach((style, i) => {
      expect(problems([action({ id: `b${i}`, style })]), 'to equal', []);
    });
    expect(problems([action({ disabled: true })]), 'to equal', []);
    expect(problems([action({ id: 'x'.repeat(50), label: 'y'.repeat(80) })]), 'to equal', []);
    const row = id => Array.from({ length: 5 }, (_, i) => action({ id: `${id}${i}` }));
    expect(problems(['a', 'b', 'c', 'd', 'e'].map(row)), 'to equal', []);
  });

  it('Should refuse anything that is not a list', () => {
    ['x', 5, null, undefined, {}, action()].forEach((input) => {
      expect(problems(input), 'to equal', ['components must be a list of buttons, or a list of rows of buttons']);
    });
  });

  it('Should refuse more than 5 rows, empty rows, and more than 5 buttons in a row', () => {
    const row = id => [action({ id })];
    expect(problems(['a', 'b', 'c', 'd', 'e', 'f'].map(row)), 'to equal', ['components: at most 5 rows']);
    expect(problems([[action()], []]), 'to equal', ['row 1 needs at least one button']);
    const six = Array.from({ length: 6 }, (_, i) => action({ id: `b${i}` }));
    expect(problems(six), 'to equal', ['row 0: at most 5 buttons']);
  });

  it('Should refuse a button that is not an object, and rows mixed with buttons', () => {
    expect(problems(['x']), 'to equal', ['row 0 button 0 must be an object']);
    expect(problems([action(), [action({ id: 'b' })]]), 'to equal', ['row 0 button 1 must be an object']);
  });

  it('Should need exactly one of id or url', () => {
    expect(problems([{ label: 'None' }]), 'to equal', ['row 0 button 0: needs exactly one of id or url']);
    expect(problems([{ id: 'a', url: 'https://example.test', label: 'Both' }]), 'to have length', 1);
  });

  it('Should need a label of 1 to 80 characters', () => {
    expect(problems([action({ label: '' })]), 'to equal', ['row 0 button 0: label must be 1-80 characters']);
    expect(problems([action({ label: '   ' })]), 'to have length', 1);
    expect(problems([action({ label: 'x'.repeat(81) })]), 'to have length', 1);
    expect(problems([action({ label: undefined })]), 'to have length', 1);
    expect(problems([action({ label: 5 })]), 'to have length', 1);
  });

  it('Should check ids: characters, length, and that they are not used twice', () => {
    expect(problems([action({ id: '' })]), 'to have length', 1);
    expect(problems([action({ id: 'has space' })]), 'to have length', 1);
    expect(problems([action({ id: 'x'.repeat(51) })]), 'to have length', 1);
    expect(problems([action({ id: 5 })]), 'to have length', 1);
    expect(problems([action({ id: 'a.b:c-d_e' })]), 'to equal', []);
    expect(problems([[action()], [action()]]), 'to equal', ['row 1 button 0: duplicate id confirm']);
  });

  it('Should check styles and disabled', () => {
    expect(problems([action({ style: 'blurple' })]), 'to equal', [
      'row 0 button 0: style must be one of primary, secondary, success, danger',
    ]);
    expect(problems([action({ disabled: 'yes' })]), 'to equal', ['row 0 button 0: disabled must be a boolean']);
  });

  it('Should accept only http and https addresses for a link', () => {
    expect(problems([link({ url: 'http://example.test' })]), 'to equal', []);
    ['ftp://example.test', 'example.test', ['java', 'script:run()'].join(''), 'https://', 'https://a b', ''].forEach((url) => {
      expect(problems([link({ url })]), 'to have length', 1);
    });
    expect(problems([link({ url: `https://example.test/${'x'.repeat(520)}` })]), 'to have length', 1);
  });

  it('Should refuse a style on a link, and any unknown property', () => {
    expect(problems([link({ style: 'primary' })]), 'to equal', ['row 0 button 0: unknown property style']);
    expect(problems([action({ emoji: 'x' })]), 'to equal', ['row 0 button 0: unknown property emoji']);
    expect(problems([action({ url: undefined, extra: 1 })]), 'to equal', ['row 0 button 0: unknown property extra']);
  });

  it('Should list every problem it finds', () => {
    expect(problems([action({ label: '' }), action({ id: 'b', style: 'x' })]), 'to have length', 2);
  });
});

describe('buildComponents', () => {
  it('Should put a flat list of buttons in one row', () => {
    expect(buildComponents([action(), link()]), 'to equal', [[action(), link()]]);
  });

  it('Should keep rows as they are, and an empty list as nothing', () => {
    const rows = [[action()], [action({ id: 'b' })]];
    expect(buildComponents(rows), 'to equal', rows);
    expect(buildComponents([]), 'to equal', []);
  });

  it('Should return a copy, so the caller cannot change what was checked', () => {
    const rows = [[action()]];
    const built = buildComponents(rows);

    built[0][0].label = 'Changed';

    expect(rows[0][0].label, 'to be', 'Confirm');
  });

  it('Should throw, listing every problem', () => {
    expect(() => buildComponents([action({ label: '' }), action({ id: 'b', style: 'x' })]), 'to throw', /Invalid components:[\s\S]*label[\s\S]*style/);
    expect(() => buildComponents('nope'), 'to throw', /Invalid components/);
  });
});

describe('component custom ids', () => {
  it('Should carry the plugin and the button, and read them back', () => {
    const customId = componentCustomId('vouchers', 'confirm:1');

    expect(customId, 'to be', 'btn:vouchers:confirm:1');
    expect(parseComponentCustomId(customId), 'to equal', { cid: 'vouchers', id: 'confirm:1' });
  });

  it('Should work with the push keys plugins get', () => {
    const cid = '-ME46b7XkezbLXeKZOay';

    expect(parseComponentCustomId(componentCustomId(cid, 'go')), 'to equal', { cid, id: 'go' });
  });

  it('Should refuse a plugin id that cannot be told apart from the button id', () => {
    expect(() => componentCustomId('a:b', 'go'), 'to throw', /cannot contain/);
    expect(() => componentCustomId('', 'go'), 'to throw', /needs the id of its plugin/);
    expect(() => componentCustomId(undefined, 'go'), 'to throw');
  });

  it('Should refuse a custom id that Discord would reject for its length', () => {
    expect(() => componentCustomId('x'.repeat(46), 'y'.repeat(50)), 'to throw', /too long.*101 of 100/);
    expect(componentCustomId('x'.repeat(45), 'y'.repeat(50)), 'to have length', 100);
  });

  it('Should leave other custom ids alone, such as the connector\'s own paging buttons', () => {
    expect(parseComponentCustomId('page:abc123:2'), 'to be null');
    expect(parseComponentCustomId('btn:vouchers'), 'to be null');
    expect(parseComponentCustomId('btn::x'), 'to be null');
    expect(parseComponentCustomId(undefined), 'to be null');
    expect(parseComponentCustomId(5), 'to be null');
  });
});
