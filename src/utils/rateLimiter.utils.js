const requests = new Map();

function isRateLimited(key, limit, windowMs) {
  const now = Date.now();

  if (!requests.has(key)) {
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

module.exports = { isRateLimited };
