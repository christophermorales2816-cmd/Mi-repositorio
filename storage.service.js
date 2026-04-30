// ============================================================
// storage.service.js
// ============================================================

import { CACHE_TTL_MS } from "./constants.js";

export class StorageService {
  constructor() {
    this.PREFIX = "weather_";
  }

  today() {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Costa_Rica",
    });
  }

  async get(provinceId) {
    const key = `${this.PREFIX}${provinceId}`;
    const result = await chrome.storage.local.get(key);
    const cached = result[key];

    if (!cached) return null;

    if (cached.date !== this.today()) {
      await this.delete(provinceId);
      return null;
    }

    return cached;
  }

  async set(provinceId, data) {
    const key = `${this.PREFIX}${provinceId}`;
    const cache = {
      date: this.today(),
      data,
    };
    await chrome.storage.local.set({ [key]: cache });
  }

  isStale(cache) {
    return Date.now() - cache.data.fetchedAt > CACHE_TTL_MS;
  }

  async clearAll() {
    await chrome.storage.local.clear();
  }

  async delete(provinceId) {
    await chrome.storage.local.remove(`${this.PREFIX}${provinceId}`);
  }
}
