const cache = new Map();

const MAX_SIZE = 1000;

function get(key) {
  const data = cache.get(key);
  if (!data) return undefined;

  if (Date.now() > data.expiry) {
    cache.delete(key);
    return undefined;
  }

  return data.value;
}

function set(key, value, ttl = 60000) {
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
}

function del(key) {
  cache.delete(key);
}

function clear() {
  cache.clear();
}

function cleanupCache() {
  const now = Date.now();

  for (const [key, data] of cache.entries()) {
    if (now > data.expiry) {
      cache.delete(key);
    }
  }
}

function size() {
  return cache.size;
}

module.exports = { get, set, del, clear, cleanupCache, size };
