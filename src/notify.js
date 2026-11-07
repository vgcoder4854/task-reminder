import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addDays, today, parse, fromMin, getItemsForDate, wantsRemind, isDone } from './logic';

export const isNative = Capacitor.isNativePlatform();
const CHANNEL = 'alarm';

function hid(s) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 2147483000) + 1;
}

export async function setupNotifications() {
  if (!isNative) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL,
      name: 'Task alarms',
      description: 'Reminders for your scheduled tasks',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
    });
    await LocalNotifications.requestPermissions();
    if (!localStorage.getItem('exactAsked')) {
      localStorage.setItem('exactAsked', '1');
      const x = await LocalNotifications.checkExactNotificationSetting();
      if (x.exact_alarm !== 'granted') await LocalNotifications.changeExactNotificationSetting();
    }
  } catch (e) {
    console.warn('notification setup', e);
  }
}

// Re-schedule every upcoming reminder (next 60 days) from current data
export async function scheduleAll(state) {
  if (!isNative) return;
  try {
    const pend = await LocalNotifications.getPending();
    if (pend.notifications.length) {
      await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    }
    const now = Date.now();
    const t0 = today();
    const list = [];
    for (let i = 0; i < 60 && list.length < 300; i++) {
      const d = addDays(t0, i);
      for (const it of getItemsForDate(state, d)) {
        if (!it.slot || !wantsRemind(it.task, it.entry) || isDone(it.task, it.entry)) continue;
        const at = parse(d);
        at.setMinutes(it.slot.start);
        if (at.getTime() <= now) continue;
        list.push({
          id: hid(d + it.task.id),
          title: '⏰ ' + it.task.title,
          body: `${fromMin(it.slot.start)}–${fromMin(it.slot.end)}${it.task.goal ? ' · ' + it.task.goal : ''}`,
          schedule: { at, allowWhileIdle: true },
          channelId: CHANNEL,
        });
      }
    }
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (e) {
    console.warn('schedule', e);
  }
}

export async function scheduleTest() {
  const at = new Date(Date.now() + 10000);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 999999,
        title: '⏰ Test alarm',
        body: 'Your reminders will sound like this',
        schedule: { at, allowWhileIdle: true },
        channelId: CHANNEL,
      },
    ],
  });
}
