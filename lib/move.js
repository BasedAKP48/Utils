/**
 * Moves data to new location, prioritizing existing data in new location if it exists.
 * @param {admin.database.Reference} root
 * @param {String} from location to copy data from
 * @param {String} to location to copy data to
 * @returns {Promise<boolean | 'merged'>} true if data moved to new location,
* 'merged' if data was merged,
 * false if data did not exist.
 */
module.exports = (root, from, to) => root.child(from).once('value')
  .then(f => f.exists() && root.child(to).once('value')
    .then(t => t.ref.set(Object.assign(f.val(), t.val()))
      .then(f.remove)
      .then(() => !t.exists() || 'merged')));
