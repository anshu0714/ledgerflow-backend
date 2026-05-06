class LRUCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key);

    if (Date.now() > value.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, value);

    return value.value;
  }

  set(key, value, ttl = 60000) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    const expiry = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiry,
    });

    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  del(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}

module.exports = new LRUCache(1000);
