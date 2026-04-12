const cache = new Map();

function get(key) {
  return cache.has(key) ? cache.get(key) : undefined;
}

function set(key, value) {
  cache.set(key, value);
}

function del(key) {
  cache.delete(key);
}

function clear() {
  cache.clear();
}

module.exports = { get, set, del, clear };
