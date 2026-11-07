import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import TrackerPage from './pages/TrackerPage';
import { getState, useStore } from './store';
import { setupNotifications, scheduleAll } from './notify';
import { startAlarm, stopAlarm } from './alarm';
import { today, pad, getItemsForDate, wantsRemind, isDone, fromMin } from './logic';

export default function App() {
  const [tab, setTab] = useState('tasks');
  const [ring, setRing] = useState(null);
  useStore();

  useEffect(() => {
    setupNotifications().then(() => scheduleAll(getState()));
    // Native: if a reminder fires while the app is open, also ring loudly in-app
    let sub;
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationReceived', (n) => {
        setRing({ title: n.title?.replace('⏰ ', '') || 'Reminder', time: n.body || '' });
        startAlarm();
      }).then((h) => (sub = h));
    }
    // Web preview: check every 10s
    const iv = setInterval(() => {
      if (Capacitor.isNativePlatform()) return;
      const now = new Date();
      const min = now.getHours() * 60 + now.getMinutes();
      for (const it of getItemsForDate(getState(), today())) {
        if (!it.slot || it.slot.start !== min || !wantsRemind(it.task, it.entry) || isDone(it.task, it.entry)) continue;
        const key = `fired|${today()}|${it.task.id}|${min}`;
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, '1');
        setRing({ title: it.task.title, time: `${fromMin(it.slot.start)}–${fromMin(it.slot.end)}` });
        startAlarm();
      }
    }, 10000);
    return () => {
      clearInterval(iv);
      sub && sub.remove();
    };
  }, []);

  const dismiss = () => {
    stopAlarm();
    setRing(null);
  };

  return (
    <div className="app">
      <main>
        {tab === 'tasks' && <TasksPage />}
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'tracker' && <TrackerPage />}
      </main>
      <nav>
        {[
          ['tasks', '📝', 'Tasks'],
          ['calendar', '📅', 'Calendar'],
          ['tracker', '📈', 'Tracker'],
        ].map(([k, i, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            <span>{i}</span>
            {l}
          </button>
        ))}
      </nav>
      {ring && (
        <div className="ring">
          <div className="ring-box">
            <div style={{ fontSize: 48 }}>⏰</div>
            <h2>{ring.title}</h2>
            <p>{ring.time}</p>
            <button className="btn" onClick={dismiss}>Stop alarm</button>
          </div>
        </div>
      )}
    </div>
  );
}
