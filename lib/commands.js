const { applyDefaults, validateDefaults } = require('./commandSettings');

const NAME = /^[a-z0-9_-]{1,32}$/;
const ARG_TYPES = ['string', 'integer', 'boolean'];
const MAX_ARGS = 25;
const MAX_DESCRIPTION = 100;
const KNOWN = ['description', 'aliases', 'args', 'private', 'enabled'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;

function validateArgs(args, where) {
  if (!Array.isArray(args)) return [`${where}: args must be an array`];
  if (args.length > MAX_ARGS) return [`${where}: at most ${MAX_ARGS} args`];
  const problems = [];
  const seen = new Set();
  let optional = false;
  args.forEach((arg, i) => {
    const at = `${where}: args[${i}]`;
    if (!isObject(arg)) {
      problems.push(`${at} must be an object`);
      return;
    }
    if (typeof arg.name !== 'string' || !NAME.test(arg.name)) problems.push(`${at}: invalid name`);
    else if (seen.has(arg.name)) problems.push(`${at}: duplicate name ${arg.name}`);
    else seen.add(arg.name);
    if (!isText(arg.description) || arg.description.length > MAX_DESCRIPTION) {
      problems.push(`${at}: description must be 1-${MAX_DESCRIPTION} characters`);
    }
    if (!ARG_TYPES.includes(arg.type)) problems.push(`${at}: type must be one of ${ARG_TYPES.join(', ')}`);
    if (arg.required !== undefined && typeof arg.required !== 'boolean') problems.push(`${at}: required must be a boolean`);
    if (arg.required === true && optional) problems.push(`${at}: required args must come before optional ones`);
    if (arg.required !== true) optional = true;
    Object.keys(arg)
      .filter(key => !['name', 'description', 'type', 'required'].includes(key))
      .forEach(key => problems.push(`${at}: unknown property ${key}`));
  });
  return problems;
}

function validateCommand(name, definition) {
  const where = `command ${name}`;
  if (!NAME.test(name)) return [`${where}: name must be 1-32 lowercase letters, digits, - or _`];
  if (!isObject(definition)) return [`${where}: must be an object`];

  const problems = [];
  if (!isText(definition.description) || definition.description.length > MAX_DESCRIPTION) {
    problems.push(`${where}: description must be 1-${MAX_DESCRIPTION} characters`);
  }
  if (definition.aliases !== undefined) {
    if (!Array.isArray(definition.aliases) || definition.aliases.some(alias => typeof alias !== 'string' || !NAME.test(alias))) {
      problems.push(`${where}: aliases must be an array of valid names`);
    }
  }
  if (definition.args !== undefined) problems.push(...validateArgs(definition.args, where));
  ['private', 'enabled'].forEach((key) => {
    if (definition[key] !== undefined && typeof definition[key] !== 'boolean') problems.push(`${where}: ${key} must be a boolean`);
  });
  Object.keys(definition).forEach((key) => {
    if (KNOWN.includes(key)) return;
    if (!isObject(definition[key]) || !/^[a-z][a-z0-9_-]*$/.test(key)) {
      problems.push(`${where}: unknown property ${key}`);
    }
  });
  return problems;
}

function validate(commands) {
  if (!isObject(commands)) return ['commands must be an object keyed by command name'];
  return Object.entries(commands)
    .flatMap(([name, definition]) => validateCommand(name, definition));
}

function assertValid(commands) {
  const problems = validate(commands);
  if (problems.length) throw new Error(`Invalid commands:\n${problems.join('\n')}`);
}

const plain = value => JSON.parse(JSON.stringify(value));

function publish(commandsRef, commands) {
  return Promise.all(Object.entries(commands).map(([name, definition]) => commandsRef
    .child(name)
    .transaction(current => (current === null ? plain(definition) : undefined))));
}

async function collect(root) {
  const registry = (await root.child('registry').once('value')).val() || {};
  const entries = await Promise.all(Object.keys(registry)
    .filter(cid => isObject(registry[cid]) && isObject(registry[cid].info))
    .map(async (cid) => {
      const [stored, defaults] = await Promise.all(['commands', 'commandDefaults']
        .map(async key => (await root.child(`config/${cid}/${key}`).once('value')).val()));
      return {
        cid, entry: registry[cid], stored, defaults,
      };
    }));

  const found = [];
  const invalid = [];
  entries
    .filter(({ stored }) => isObject(stored))
    .forEach(({
      cid, entry, stored, defaults,
    }) => {
      const defaultProblems = defaults === null ? [] : validateDefaults(defaults);
      if (defaultProblems.length) invalid.push({ cid, name: 'commandDefaults', problems: defaultProblems });

      Object.entries(stored).forEach(([name, raw]) => {
        const problems = validateCommand(name, raw);
        if (problems.length) {
          invalid.push({ cid, name, problems });
          return;
        }
        const definition = applyDefaults(raw, defaultProblems.length ? undefined : defaults);
        if (definition.enabled === false) return;
        found.push({
          ...definition,
          name,
          cid,
          plugin: entry.info.pluginName,
          instance: entry.info.instanceName,
          online: !!(entry.presence && entry.presence.connected),
        });
      });
    });

  found.sort((a, b) => Number(b.online) - Number(a.online) || a.cid.localeCompare(b.cid));
  const commands = [];
  const conflicts = [];
  const taken = new Map();
  found.forEach((command) => {
    if (taken.has(command.name)) {
      conflicts.push({ name: command.name, cid: command.cid, winner: taken.get(command.name) });
      return;
    }
    taken.set(command.name, command.cid);
    commands.push(command);
  });
  return { commands, conflicts, invalid };
}

module.exports = {
  assertValid,
  collect,
  publish,
  validate,
};
