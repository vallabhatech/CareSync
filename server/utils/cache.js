/**
 * Simple in-memory cache utility with TTL.
 */
class Cache {
  constructor(ttlSeconds = 60 * 5) {
    this.cache = new Map();
    this.defaultTtl = ttlSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = null) {
    const expiry = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl);
    this.cache.set(key, { value, expiry });
  }

  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

module.exports = new Cache();
