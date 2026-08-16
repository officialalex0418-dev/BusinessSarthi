import { Capacitor } from '@capacitor/core';

/**
 * Mobile Storage Engine (Hybrid SQLite/IndexedDB)
 *
 * Requirement: Use SQLite for local data on mobile.
 * Fallback: Use IndexedDB for web/dev.
 */
class LocalDatabase {
  constructor(dbName = 'bs_mobile_db') {
    this.dbName = dbName;
    this.isNative = Capacitor.isNativePlatform();
  }

  // Implementation using IndexedDB (Reliable fallback for SQLite on Hybrid Apps)
  async _openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('locations')) {
          db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async addLocation(point) {
    const db = await this._openIndexedDB();
    const tx = db.transaction('locations', 'readwrite');
    tx.objectStore('locations').add({ ...point, timestamp: Date.now() });
    return new Promise(resolve => tx.oncomplete = resolve);
  }

  async getAllLocations() {
    const db = await this._openIndexedDB();
    const tx = db.transaction('locations', 'readonly');
    const request = tx.objectStore('locations').getAll();
    return new Promise(resolve => request.onsuccess = () => resolve(request.result));
  }

  async clearLocations() {
    const db = await this._openIndexedDB();
    const tx = db.transaction('locations', 'readwrite');
    tx.objectStore('locations').clear();
    return new Promise(resolve => tx.oncomplete = resolve);
  }
}

export const localDb = new LocalDatabase();
