const TYPES = ['string', 'integer', 'number', 'boolean', 'user', 'channel', 'role', 'mentionable', 'attachment'];
const CHOICE_TYPES = ['string', 'integer', 'number'];
const VALUE_TYPES = ['integer', 'number'];
const MENTION_TYPES = ['user', 'channel', 'role', 'mentionable'];
const KEYS = [
  'name', 'description', 'type', 'required', 'choices', 'autocomplete',
  'minValue', 'maxValue', 'minLength', 'maxLength',
];
const MAX_CHOICES = 25;
const MAX_AUTOCOMPLETE = 500;
const MAX_CHOICE = 100;
const MAX_LENGTH = 6000;
const SUGGESTIONS = 5;
const TRUE_WORDS = ['true', 'yes', 'y', '1', 'on', 'hidden', 'private'];
const FALSE_WORDS = ['false', 'no', 'n', '0', 'off'];
const ID = '\\d{15,25}';
const MENTIONS = {
  user: new RegExp(`^(?:<@!?(${ID})>|(${ID}))$`),
  role: new RegExp(`^(?:<@&(${ID})>|(${ID}))$`),
  channel: new RegExp(`^(?:<#(${ID})>|(${ID}))$`),
  mentionable: new RegExp(`^(?:<@[!&]?(${ID})>|(${ID}))$`),
};

const listOf = items => (items.length > 1
  ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
  : items.join(''));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const hasChoices = arg => Array.isArray(arg.choices) && arg.choices.length > 0;

function validateChoices(arg, at) {
  if (arg.choices === undefined) return [];
  if (!CHOICE_TYPES.includes(arg.type)) return [`${at}: only ${listOf(CHOICE_TYPES)} args can have choices`];
  if (!Array.isArray(arg.choices)) return [`${at}: choices must be an array`];
  const limit = arg.autocomplete === true ? MAX_AUTOCOMPLETE : MAX_CHOICES;
  if (arg.choices.length > limit) return [`${at}: at most ${limit} choices`];

  const problems = [];
  const seen = new Set();
  arg.choices.forEach((choice, i) => {
    const where = `${at}: choices[${i}]`;
    if (!isObject(choice)) {
      problems.push(`${where} must be an object`);
      return;
    }
    if (!isText(choice.name) || choice.name.length > MAX_CHOICE) {
      problems.push(`${where}: name must be 1-${MAX_CHOICE} characters`);
    }
    const valid = {
      integer: Number.isSafeInteger(choice.value),
      number: Number.isFinite(choice.value),
      string: isText(choice.value) && choice.value.length <= MAX_CHOICE,
    }[arg.type];
    const expected = {
      integer: 'a whole number',
      number: 'a number',
      string: `1-${MAX_CHOICE} characters of text`,
    }[arg.type];
    if (!valid) problems.push(`${where}: value must be ${expected}`);
    else if (seen.has(choice.value)) problems.push(`${where}: duplicate value ${choice.value}`);
    else seen.add(choice.value);
    Object.keys(choice)
      .filter(key => !['name', 'value'].includes(key))
      .forEach(key => problems.push(`${where}: unknown property ${key}`));
  });
  return problems;
}

function validateAutocomplete(arg, at) {
  if (arg.autocomplete === undefined) return [];
  if (typeof arg.autocomplete !== 'boolean') return [`${at}: autocomplete must be a boolean`];
  if (arg.autocomplete !== true) return [];
  if (!CHOICE_TYPES.includes(arg.type)) return [`${at}: only ${listOf(CHOICE_TYPES)} args can autocomplete`];
  if (!hasChoices(arg)) return [`${at}: autocomplete needs the list of choices to search`];
  return [];
}

function validateBounds(arg, at, [lowName, highName], { allowed, valid, describe }) {
  const given = [lowName, highName].filter(key => arg[key] !== undefined);
  if (!given.length) return [];
  if (!allowed.includes(arg.type)) return [`${at}: ${listOf(given)} only apply to ${listOf(allowed)} args`];

  const problems = given
    .filter(key => !valid(arg[key], key))
    .map(key => `${at}: ${key} must be ${describe(key)}`);
  const ordered = given.length === 2 && problems.length === 0 && arg[lowName] > arg[highName];
  return ordered ? [`${at}: ${lowName} cannot be more than ${highName}`] : problems;
}

function validateLimits(arg, at) {
  const value = validateBounds(arg, at, ['minValue', 'maxValue'], {
    allowed: VALUE_TYPES,
    valid: v => (arg.type === 'integer' ? Number.isSafeInteger(v) : Number.isFinite(v)),
    describe: () => (arg.type === 'integer' ? 'a whole number' : 'a number'),
  });
  const length = validateBounds(arg, at, ['minLength', 'maxLength'], {
    allowed: ['string'],
    valid: (v, key) => Number.isInteger(v) && v >= (key === 'minLength' ? 0 : 1) && v <= MAX_LENGTH,
    describe: key => `a whole number from ${key === 'minLength' ? 0 : 1} to ${MAX_LENGTH}`,
  });
  const limited = ['minValue', 'maxValue', 'minLength', 'maxLength'].some(key => arg[key] !== undefined);
  return [
    ...value,
    ...length,
    ...(limited && arg.choices !== undefined ? [`${at}: limits cannot be combined with choices`] : []),
  ];
}

function validateArg(arg, at) {
  return [
    ...validateChoices(arg, at),
    ...validateAutocomplete(arg, at),
    ...validateLimits(arg, at),
  ];
}

function findChoice(arg, word) {
  const text = String(word).trim();
  const lower = text.toLowerCase();
  const asNumber = Number(text);
  return arg.choices.find((choice) => {
    if (typeof choice.value === 'number') {
      if (text !== '' && Number.isFinite(asNumber) && choice.value === asNumber) return true;
    } else if (String(choice.value) === text) {
      return true;
    }
    return choice.name.toLowerCase() === lower;
  }) || null;
}

function filterChoices(choices, query, limit = MAX_CHOICES) {
  const wanted = String(query === undefined || query === null ? '' : query).trim().toLowerCase();
  if (!wanted) return choices.slice(0, limit);

  const starts = [];
  const contains = [];
  choices.forEach((choice) => {
    const name = choice.name.toLowerCase();
    const value = String(choice.value).toLowerCase();
    if (name.startsWith(wanted) || value.startsWith(wanted)) starts.push(choice);
    else if (name.includes(wanted) || value.includes(wanted)) contains.push(choice);
  });
  return [...starts, ...contains].slice(0, limit);
}

function readChoice(arg, word) {
  const exact = findChoice(arg, word);
  if (exact) return { value: exact.value };

  if (arg.autocomplete === true) {
    const near = filterChoices(arg.choices, word, SUGGESTIONS);
    if (near.length === 1) return { value: near[0].value };
    if (near.length > 1) return { problem: `${arg.name} could be ${near.map(choice => choice.name).join(', ')}` };
  }
  return arg.choices.length <= MAX_CHOICES
    ? { problem: `${arg.name} must be one of: ${arg.choices.map(choice => choice.name).join(', ')}` }
    : { problem: `${arg.name} is not one of the choices` };
}

function checkRange(arg, value) {
  const [low, high] = [arg.minValue, arg.maxValue];
  if (low !== undefined && high !== undefined && (value < low || value > high)) {
    return { problem: `${arg.name} must be between ${low} and ${high}` };
  }
  if (low !== undefined && value < low) return { problem: `${arg.name} must be at least ${low}` };
  if (high !== undefined && value > high) return { problem: `${arg.name} must be at most ${high}` };
  return { value };
}

function checkLength(arg, value) {
  const [low, high] = [arg.minLength, arg.maxLength];
  if (low !== undefined && value.length < low) return { problem: `${arg.name} must be at least ${low} characters` };
  if (high !== undefined && value.length > high) return { problem: `${arg.name} must be at most ${high} characters` };
  return { value };
}

function readValue(arg, word) {
  if (hasChoices(arg)) return readChoice(arg, word);

  if (arg.type === 'integer') {
    const number = Number(word);
    return /^-?\d+$/.test(word) && Number.isSafeInteger(number)
      ? checkRange(arg, number)
      : { problem: `${arg.name} must be a whole number` };
  }
  if (arg.type === 'number') {
    const number = Number(word);
    return /^-?\d+(\.\d+)?$/.test(word) && Number.isFinite(number)
      ? checkRange(arg, number)
      : { problem: `${arg.name} must be a number` };
  }
  if (arg.type === 'string') return checkLength(arg, word);
  if (MENTION_TYPES.includes(arg.type)) {
    const match = MENTIONS[arg.type].exec(word);
    return match
      ? { value: match[1] || match[2] }
      : { problem: `${arg.name} must be a ${arg.type === 'mentionable' ? 'user or role' : arg.type}, as a mention or an id` };
  }
  if (arg.type === 'attachment') {
    return { problem: `${arg.name} needs an attachment, which only the slash command can take` };
  }

  const lower = word.toLowerCase();
  if (TRUE_WORDS.includes(lower)) return { value: true };
  if (FALSE_WORDS.includes(lower)) return { value: false };
  return { problem: `${arg.name} must be yes or no` };
}

module.exports = {
  KEYS,
  MAX_CHOICES,
  TYPES,
  filterChoices,
  findChoice,
  hasChoices,
  readValue,
  validateArg,
};
