import { get, set, update } from 'idb-keyval';

const QUEUE_KEY = 'caresync_offline_queue';

let migrationPromise = null;
function migrateLegacyQueue() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    try {
      const legacyData = localStorage.getItem(QUEUE_KEY);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await update(QUEUE_KEY, (val) => {
            const current = val || [];
            // Give legacy items an ID if they don't have one
            const migrated = parsed.map(p => ({ ...p, _id: p._id || Date.now() + Math.random() }));
            return [...current, ...migrated];
          });
        }
        localStorage.removeItem(QUEUE_KEY);
      }
    } catch (err) {
      console.error('Migration error:', err);
    }
  })();
  return migrationPromise;
}

/**
 * Gets the offline request queue from IndexedDB.
 * @returns {Promise<Array>} The current queue
 */
export async function getOfflineQueue() {
  await migrateLegacyQueue();
  const queue = await get(QUEUE_KEY);
  if (queue === undefined) return [];
  return queue;
}

/**
 * Pushes a new request to the offline queue.
 * @param {Object} request - The request object (url, method, data, headers)
 */
export async function enqueueOfflineRequest(request) {
  await migrateLegacyQueue();
  let finalQueue = [];
  await update(QUEUE_KEY, (val) => {
    finalQueue = [...(val || []), { ...request, retryCount: 0, _id: Date.now() + Math.random() }];
    return finalQueue;
  });
  window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: finalQueue }));
}

/**
 * Atomically removes a request from the offline queue.
 */
export async function removeOfflineRequest(requestId) {
  await migrateLegacyQueue();
  let finalQueue = [];
  await update(QUEUE_KEY, (val) => {
    finalQueue = (val || []).filter(req => req._id !== requestId);
    return finalQueue;
  });
  window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: finalQueue }));
}

/**
 * Atomically updates a request (e.g. retryCount).
 */
export async function updateOfflineRequest(requestId, updates) {
  await migrateLegacyQueue();
  let finalQueue = [];
  await update(QUEUE_KEY, (val) => {
    finalQueue = (val || []).map(req => req._id === requestId ? { ...req, ...updates } : req);
    return finalQueue;
  });
  window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: finalQueue }));
}

/**
 * Clears the offline queue.
 */
export async function clearOfflineQueue() {
  await set(QUEUE_KEY, []);
  window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: [] }));
}
