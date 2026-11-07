const MAX_SUBCOMMANDS = 25;

function subcommandName(command) {
  if (!command.group) return undefined;
  if (command.subcommand) return command.subcommand;
  const prefix = `${command.group}-`;
  return command.name.startsWith(prefix) && command.name.length > prefix.length
    ? command.name.slice(prefix.length)
    : command.name;
}

function groupCommands(commands) {
  const list = Array.from(commands);
  const standalone = list.filter(command => !command.group);
  const taken = new Set(standalone.map(command => command.name));
  const groups = new Map();
  const conflicts = [];

  list.filter(command => command.group).forEach((command) => {
    const refuse = reason => conflicts.push({ name: command.name, group: command.group, reason });
    if (taken.has(command.group)) {
      refuse('a command has the name of the group');
      return;
    }

    const group = groups.get(command.group)
      || { name: command.group, description: '', subcommands: [] };
    groups.set(command.group, group);
    if (!group.description && command.groupDescription) {
      group.description = command.groupDescription;
    }

    const name = subcommandName(command);
    if (group.subcommands.some(item => item.name === name)) {
      refuse('the subcommand is already taken');
    } else if (group.subcommands.length >= MAX_SUBCOMMANDS) {
      refuse(`a group has at most ${MAX_SUBCOMMANDS} subcommands`);
    } else {
      group.subcommands.push({ name, command });
    }
  });

  return {
    standalone,
    groups: [...groups.values()].map(group => ({
      ...group,
      description: group.description || group.name,
    })),
    conflicts,
  };
}

module.exports = { MAX_SUBCOMMANDS, groupCommands, subcommandName };
