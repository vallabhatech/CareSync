/* global globalThis */
/**
 * Unit tests for src/utils/notifications.js
 *
 * Verifies permission handling, scheduling logic, and timer cleanup.
 */

import {
  requestNotificationPermission,
  scheduleNotifications,
  clearScheduledNotifications,
  getActiveTimerCount,
  getLocalDateString,
  PUSH_ENABLED_KEY,
} from './notifications';

/* ------------------------------------------------------------------ */
/*  Mocks & helpers                                                    */
/* ------------------------------------------------------------------ */

/** Build a medicine entry for today at the given HH:MM. */
function makeMed(name, time) {
  const today = getLocalDateString();
  return { id: name.toLowerCase().replace(/\s/g, '-'), name, time, date: today };
}

/** Build a medicine entry for yesterday. */
function makeMedYesterday(name, time) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = getLocalDateString(d);
  return { id: name.toLowerCase(), name, time, date: yesterday };
}

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  clearScheduledNotifications();
});

afterEach(() => {
  jest.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  requestNotificationPermission                                      */
/* ------------------------------------------------------------------ */

describe('requestNotificationPermission', () => {
  const originalNotification = globalThis.Notification;

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  it('returns "denied" when Notification API is not available', async () => {
    delete globalThis.Notification;
    const result = await requestNotificationPermission();
    expect(result).toBe('denied');
  });

  it('returns "granted" immediately when already granted', async () => {
    globalThis.Notification = { permission: 'granted', requestPermission: jest.fn() };
    const result = await requestNotificationPermission();
    expect(result).toBe('granted');
    expect(globalThis.Notification.requestPermission).not.toHaveBeenCalled();
  });

  it('calls requestPermission and returns its result', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('denied'),
    };
    const result = await requestNotificationPermission();
    expect(globalThis.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(result).toBe('denied');
  });
});

/* ------------------------------------------------------------------ */
/*  scheduleNotifications                                              */
/* ------------------------------------------------------------------ */

describe('scheduleNotifications', () => {
  const originalNotification = globalThis.Notification;

  beforeEach(() => {
    globalThis.Notification = { permission: 'granted' };
    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
  });

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  it('does nothing when push is disabled in settings', () => {
    localStorage.setItem(PUSH_ENABLED_KEY, 'false');
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Aspirin', futureTime)]);
    expect(getActiveTimerCount()).toBe(0);
  });

  it('does nothing when Notification API is missing', () => {
    delete globalThis.Notification;
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Aspirin', futureTime)]);
    expect(getActiveTimerCount()).toBe(0);
  });

  it('does nothing when permission is not granted', () => {
    globalThis.Notification = { permission: 'default' };
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Aspirin', futureTime)]);
    expect(getActiveTimerCount()).toBe(0);
  });

  it('schedules a timer for a future medicine today', () => {
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Vitamin D', futureTime)]);
    expect(getActiveTimerCount()).toBe(1);
  });

  it('does not schedule a timer for a medicine whose time has passed', () => {
    const pastTime = getPastTimeStr(10);
    scheduleNotifications([makeMed('Old Med', pastTime)]);
    expect(getActiveTimerCount()).toBe(0);
  });

  it('does not schedule a timer for a medicine on a different date', () => {
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMedYesterday('Yesterday Med', futureTime)]);
    expect(getActiveTimerCount()).toBe(0);
  });

  it('clears old timers before setting new ones', () => {
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Med A', futureTime)]);
    expect(getActiveTimerCount()).toBe(1);

    // Reschedule with two medicines.
    const futureTime2 = getFutureTimeStr(20);
    scheduleNotifications([makeMed('Med A', futureTime), makeMed('Med B', futureTime2)]);
    expect(getActiveTimerCount()).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/*  clearScheduledNotifications                                        */
/* ------------------------------------------------------------------ */

describe('clearScheduledNotifications', () => {
  const originalNotification = globalThis.Notification;

  beforeEach(() => {
    globalThis.Notification = { permission: 'granted' };
    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
  });

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  it('clears all active timers', () => {
    const futureTime = getFutureTimeStr(10);
    scheduleNotifications([makeMed('Med', futureTime)]);
    expect(getActiveTimerCount()).toBe(1);

    clearScheduledNotifications();
    expect(getActiveTimerCount()).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

/** Returns an HH:MM string `minutesFromNow` in the future. */
function getFutureTimeStr(minutesFromNow) {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Returns an HH:MM string `minutesAgo` in the past. */
function getPastTimeStr(minutesAgo) {
  const d = new Date(Date.now() - minutesAgo * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
