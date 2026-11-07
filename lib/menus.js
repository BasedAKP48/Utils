const TYPES = ['user', 'message'];
const TARGET_ARG = { user: 'user', message: 'string' };
const KEYS = ['type', 'name', 'arg'];
const MAX_MENUS = 5;
const MAX_NAME = 32;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const printable = text => Array.from(text)
  .every(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127);
const validName = name => typeof name === 'string'
  && name.trim().length > 0
  && name.trim().length <= MAX_NAME
  && printable(name);

function menuName(command) {
  const given = command.context && command.context.name;
  if (validName(given)) return given.trim();
  const words = command.name.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function validateContext(definition, where) {
  const { context } = definition;
  if (context === undefined) return [];
  if (!isObject(context)) return [`${where}: context must be an object`];

  const problems = [];
  if (!TYPES.includes(context.type)) {
    problems.push(`${where}: context.type must be one of ${TYPES.join(', ')}`);
  }
  if (context.name !== undefined && !validName(context.name)) {
    problems.push(`${where}: context.name must be 1-${MAX_NAME} characters`);
  }

  const args = Array.isArray(definition.args) ? definition.args.filter(isObject) : [];
  const target = args.find(arg => arg.name === context.arg);
  if (typeof context.arg !== 'string' || !target) {
    problems.push(`${where}: context.arg must name one of the args`);
  } else if (TYPES.includes(context.type) && target.type !== TARGET_ARG[context.type]) {
    problems.push(`${where}: context.arg must be a ${TARGET_ARG[context.type]} arg for a ${context.type} menu`);
  }
  args
    .filter(arg => arg.name !== context.arg && arg.required === true)
    .forEach(arg => problems.push(`${where}: ${arg.name} must be optional, since a menu cannot ask for it`));

  Object.keys(context)
    .filter(key => !KEYS.includes(key))
    .forEach(key => problems.push(`${where}: context has an unknown property ${key}`));
  return problems;
}

function contextMenus(commands) {
  const result = { user: [], message: [], conflicts: [] };

  Array.from(commands)
    .filter(command => command.context && TYPES.includes(command.context.type))
    .forEach((command) => {
      const { type, arg } = command.context;
      const name = menuName(command);
      const list = result[type];
      const refuse = reason => result.conflicts.push({ name: command.name, type, reason });

      if (list.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        refuse('the menu name is already taken');
      } else if (list.length >= MAX_MENUS) {
        refuse(`there are at most ${MAX_MENUS} ${type} menu commands`);
      } else {
        list.push({ name, command, arg });
      }
    });

  return result;
}

module.exports = {
  MAX_MENUS,
  contextMenus,
  menuName,
  validateContext,
};
