const PREFIX = 'btn';
const CUSTOM_ID_MAX = 100;
const MAX_ROWS = 5;
const MAX_BUTTONS = 5;
const MAX_ID = 50;
const MAX_LABEL = 80;
const MAX_URL = 512;
const STYLES = ['primary', 'secondary', 'success', 'danger'];
const ID = /^[\w.:-]+$/;
const URL = /^https?:\/\/\S+$/i;
const ACTION_KEYS = ['id', 'label', 'style', 'disabled'];
const LINK_KEYS = ['url', 'label', 'disabled'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;

function asRows(input) {
  if (!Array.isArray(input)) return undefined;
  if (input.length && input.every(Array.isArray)) return input;
  return input.length ? [input] : [];
}

function validateButton(button, where, seen) {
  if (!isObject(button)) return [`${where} must be an object`];

  const problems = [];
  const link = button.url !== undefined;
  if (link === (button.id !== undefined)) problems.push(`${where}: needs exactly one of id or url`);
  if (!isText(button.label) || button.label.length > MAX_LABEL) {
    problems.push(`${where}: label must be 1-${MAX_LABEL} characters`);
  }
  if (button.disabled !== undefined && typeof button.disabled !== 'boolean') {
    problems.push(`${where}: disabled must be a boolean`);
  }

  if (link) {
    if (typeof button.url !== 'string' || !URL.test(button.url) || button.url.length > MAX_URL) {
      problems.push(`${where}: url must be an http or https address of at most ${MAX_URL} characters`);
    }
  } else if (button.id !== undefined) {
    if (typeof button.id !== 'string' || button.id.length > MAX_ID || !ID.test(button.id)) {
      problems.push(`${where}: id must be 1-${MAX_ID} letters, digits, _ . : or -`);
    } else if (seen.has(button.id)) {
      problems.push(`${where}: duplicate id ${button.id}`);
    } else {
      seen.add(button.id);
    }
    if (button.style !== undefined && !STYLES.includes(button.style)) {
      problems.push(`${where}: style must be one of ${STYLES.join(', ')}`);
    }
  }

  const known = [...(link ? LINK_KEYS : ACTION_KEYS), 'id', 'url'];
  Object.keys(button)
    .filter(key => !known.includes(key))
    .forEach(key => problems.push(`${where}: unknown property ${key}`));
  return problems;
}

function validate(input) {
  const rows = asRows(input);
  if (!rows) return ['components must be a list of buttons, or a list of rows of buttons'];
  if (rows.length > MAX_ROWS) return [`components: at most ${MAX_ROWS} rows`];

  const seen = new Set();
  return rows.flatMap((row, r) => {
    const where = `row ${r}`;
    if (!Array.isArray(row)) return [`${where} must be a list of buttons`];
    if (!row.length) return [`${where} needs at least one button`];
    if (row.length > MAX_BUTTONS) return [`${where}: at most ${MAX_BUTTONS} buttons`];
    return row.flatMap((button, b) => validateButton(button, `${where} button ${b}`, seen));
  });
}

function build(input) {
  const problems = validate(input);
  if (problems.length) throw new Error(`Invalid components:\n${problems.join('\n')}`);
  return JSON.parse(JSON.stringify(asRows(input)));
}

function customId(cid, id) {
  if (typeof cid !== 'string' || !cid || cid.includes(':')) {
    throw new Error('A component needs the id of its plugin, which cannot contain ":"');
  }
  const result = `${PREFIX}:${cid}:${id}`;
  if (result.length > CUSTOM_ID_MAX) {
    throw new Error(`The component id is too long for this plugin: ${result.length} of ${CUSTOM_ID_MAX} characters`);
  }
  return result;
}

function parseCustomId(value) {
  if (typeof value !== 'string') return null;
  const match = new RegExp(`^${PREFIX}:([^:]+):(.+)$`).exec(value);
  return match ? { cid: match[1], id: match[2] } : null;
}

module.exports = {
  build,
  customId,
  parseCustomId,
  validate,
};
