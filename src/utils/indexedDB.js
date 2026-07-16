import { get, set } from 'idb-keyval';

const QUEUE_KEY = 'caresync_offline_queue';

/**
 * Gets the offline request queue from IndexedDB.
 * @returns {Promise<Array>} The current queue
 */
export async function getOfflineQueue() {
  try {
    const queue = await get(QUEUE_KEY);
    return queue || [];
  } catch (error) {
    console.error('Error getting offline queue from IndexedDB:', error);
    return [];
  }
}

/**
 * Sets the offline request queue in IndexedDB.
 * @param {Array} queue - The queue to set
 */
export async function setOfflineQueue(queue) {
  try {
    await set(QUEUE_KEY, queue);
    // Dispatch a custom event to notify UI components (e.g. OfflineBanner)
    window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: queue }));
  } catch (error) {
    console.error('Error setting offline queue in IndexedDB:', error);
  }
}

/**
 * Pushes a new request to the offline queue.
 * @param {Object} request - The request object (url, method, data, headers)
 */
export async function enqueueOfflineRequest(request) {
  const queue = await getOfflineQueue();
  queue.push({ ...request, retryCount: 0 });
  await setOfflineQueue(queue);
}

/**
 * Clears the offline queue.
 */
export async function clearOfflineQueue() {
  await setOfflineQueue([]);
}
