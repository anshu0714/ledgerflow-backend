const requests = new Map();
const MAX_KEYS = 10000;

function isRateLimited(key, limit, windowMs) {
  const now = Date.now();

  if (!requests.has(key)) {
    if (requests.size > MAX_KEYS) {
      const firstKey = requests.keys().next().value;
      requests.delete(firstKey);
    }

    requests.set(key, []);
  }

  const timestamps = requests.get(key);

  while (timestamps.length && now - timestamps[0] > windowMs) {
    timestamps.shift();
  }

  if (timestamps.length >= limit) {
    return true;
  }

  timestamps.push(now);
  return false;
}

function cleanupRateLimiter(windowMs = 60000) {
  const now = Date.now();

  for (const [key, timestamps] of requests.entries()) {
    while (timestamps.length && now - timestamps[0] > windowMs) {
      timestamps.shift();
    }

    if (timestamps.length === 0) {
      requests.delete(key);
    }
  }
}

function size() {
  return requests.size;
}

module.exports = { isRateLimited, cleanupRateLimiter, size };
