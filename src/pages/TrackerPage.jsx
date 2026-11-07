import { useStore, patchEntry } from '../store';
import { Bar } from '../components/ui';
import { taskStats, today, addDays, getItemsForDate, progressOf, isDone, fmtSec } from '../logic';

function hours(sec) {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default function TrackerPage() {
  const state = useStore();
  const t0 = today();
  const tracked = state.tasks.filter((t) => t.tracker);

  // last 7 days average progress across all planned tasks
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t0, -i);
    const items = getItemsForDate(state, d);
    const avg = items.length ? items.reduce((a, it) => a + (isDone(it.task, it.entry) ? 100 : progressOf(it.task, it.entry)), 0) / items.length : null;
    week.push({ d, avg, n: items.length });
  }
  const todayItems = getItemsForDate(state, t0);
  const todayDone = todayItems.filter((i) => isDone(i.task, i.entry)).length;

  return (
    <div className="page">
      <h2 style={{ margin: 0 }}>Dashboard</h2>

      <div className="card">
        <b>Today: {todayDone}/{todayItems.length} done</b>
        <Bar v={todayItems.length ? (todayDone / todayItems.length) * 100 : 0} />
        <div className="muted sm" style={{ marginTop: 10 }}>Last 7 days — average progress</div>
        <div className="chart">
          {week.map((w) => (
            <div key={w.d} className="cbar">
              <div className="cfill" style={{ height: (w.avg ?? 0) + '%' }} title={w.n ? Math.round(w.avg) + '%' : 'nothing planned'} />
              <small>{new Date(w.d + 'T00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
            </div>
          ))}
        </div>
      </div>

      {!tracked.length && (
        <div className="empty">
          <p>No tracked tasks yet.</p>
          <p className="muted">Turn on “Tracker” inside a task to see streaks and stats here.</p>
        </div>
      )}

      {tracked.map((t) => {
        const s = taskStats(t, state);
        return (
          <div className="card" key={t.id}>
            <b>{t.title}</b>
            <div className="stats">
              <div><big>🔥 {s.streak}</big><small>streak</small></div>
              <div><big>🏆 {s.best}</big><small>best</small></div>
              <div><big>{s.rate30}%</big><small>30-day rate</small></div>
              <div><big>{s.doneN}</big><small>completed</small></div>
              <div><big>{hours(s.totalSec)}</big><small>total time</small></div>
            </div>
            <div className="muted sm">Last 14 days (tap to check / uncheck)</div>
            <div className="strip">
              {s.strip.map((c) => (
                <button
                  key={c.date}
                  disabled={!c.scheduled}
                  className={'sq' + (c.done ? ' on' : '') + (c.scheduled ? '' : ' off')}
                  onClick={() => patchEntry(c.date, t.id, { done: !state.entries[c.date + '|' + t.id]?.done })}
                  title={c.date}
                >
                  {+c.date.slice(8)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
