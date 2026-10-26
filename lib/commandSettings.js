const NEUTRAL = ['enabled', 'private'];
const SCOPE = /^[a-z][a-z0-9_-]*$/;
const EVERYWHERE = '*';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  if (isObject(value)) return Object.values(value);
  return [];
};

function validateDefaults(defaults) {
  if (!isObject(defaults)) return ['commandDefaults must be an object'];
  const problems = [];
  NEUTRAL.forEach((key) => {
    if (defaults[key] !== undefined && typeof defaults[key] !== 'boolean') {
      problems.push(`commandDefaults: ${key} must be a boolean`);
    }
  });
  Object.keys(defaults).forEach((key) => {
    if (NEUTRAL.includes(key)) return;
    if (!SCOPE.test(key) || !isObject(defaults[key])) {
      problems.push(`commandDefaults: unknown property ${key}`);
    }
  });
  return problems;
}

function applyDefaults(command, defaults) {
  const merged = { ...command };
  if (!isObject(defaults)) return merged;

  NEUTRAL.forEach((key) => {
    if (merged[key] === undefined && defaults[key] !== undefined) merged[key] = defaults[key];
  });
  Object.keys(defaults)
    .filter(key => !NEUTRAL.includes(key) && isObject(defaults[key]))
    .forEach((scope) => {
      merged[scope] = { ...defaults[scope], ...(isObject(command[scope]) ? command[scope] : {}) };
    });
  return merged;
}

function commandSettings(config, name, definitions) {
  const source = isObject(config) ? config : {};
  const stored = isObject(source.commands) ? source.commands[name] : undefined;
  const fallback = isObject(definitions) ? definitions[name] : undefined;
  const command = [stored, fallback].find(isObject) || {};
  return applyDefaults(command, source.commandDefaults);
}

function allowedHere(settings, msg) {
  if (!isObject(settings)) return true;
  if (settings.enabled === false) return false;

  const data = (msg && msg.data) || {};
  const scope = isObject(settings[data.connectorType]) ? settings[data.connectorType] : {};

  const direct = data.isPM === true || data.serverID === null;
  if (direct) return scope.dmPermission !== false;

  const guilds = asList(scope.guilds).map(String);
  if (!guilds.length || guilds.includes(EVERYWHERE)) return true;
  return guilds.includes(String(data.serverID));
}

function guildsOf(settings) {
  const scope = isObject(settings) && isObject(settings.discord) ? settings.discord : {};
  const guilds = asList(scope.guilds).map(String).filter(Boolean);
  return guilds.includes(EVERYWHERE) ? [] : guilds;
}

module.exports = {
  EVERYWHERE,
  allowedHere,
  applyDefaults,
  commandSettings,
  guildsOf,
  validateDefaults,
};
