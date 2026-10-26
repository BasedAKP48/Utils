const HOSTS = {
  github: 'github.com',
  gitlab: 'gitlab.com',
  bitbucket: 'bitbucket.org',
};
const PATH = '[\\w.-]+/[\\w.-]+';

const web = (host, path) => {
  const clean = path.replace(/\.git$/i, '').replace(/\/+$/, '');
  return clean ? `https://${host}/${clean}` : undefined;
};

module.exports = function repositoryURL(repository) {
  const raw = typeof repository === 'string' ? repository : repository && repository.url;
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().replace(/^git\+/i, '');

  const shorthand = value.match(new RegExp(`^(github|gitlab|bitbucket):(${PATH})$`, 'i'));
  if (shorthand) return web(HOSTS[shorthand[1].toLowerCase()], shorthand[2]);

  if (new RegExp(`^${PATH}$`).test(value)) return web(HOSTS.github, value);

  const scp = value.match(/^[\w.-]+@([\w.-]+):(.+)$/);
  if (scp) return web(scp[1], scp[2]);

  const url = value.match(/^(?:ssh|git|https?):\/\/(?:[^@/]+@)?([\w.-]+)(?::\d+)?\/(.+)$/i);
  if (url) return web(url[1], url[2]);

  return undefined;
};
