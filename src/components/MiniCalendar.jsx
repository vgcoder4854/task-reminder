import { useState } from 'react';
import { fmt, parse, today } from '../logic';

// mode 'range': from/to   |   mode 'multi': dates[]
export default function MiniCalendar({ mode, from, to, dates = [], onChange }) {
  const [cur, setCur] = useState(() => {
    const d = from ? parse(from) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = cur.getFullYear();
  const m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= count; d++) cells.push(fmt(new Date(y, m, d)));

  function pick(d) {
    if (mode === 'multi') {
      onChange({ dates: dates.includes(d) ? dates.filter((x) => x !== d) : [...dates, d].sort() });
    } else if (!from || (from && to) || d < from) {
      onChange({ from: d, to: '' });
    } else {
      onChange({ from, to: d });
    }
  }

  const cls = (d) => {
    let c = 'cal-d';
    if (d === today()) c += ' today';
    if (mode === 'multi') {
      if (dates.includes(d)) c += ' sel';
    } else {
      if (d === from || d === to) c += ' sel';
      else if (from && to && d > from && d < to) c += ' inr';
    }
    return c;
  };

  return (
    <div className="mini">
      <div className="cal-h">
        <button className="ghost" onClick={() => setCur(new Date(y, m - 1, 1))}>
          ‹
        </button>
        <b>{cur.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
        <button className="ghost" onClick={() => setCur(new Date(y, m + 1, 1))}>
          ›
        </button>
      </div>
      <div className="cal-g">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
          <div key={i} className="cal-w">
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d ? (
            <button key={i} className={cls(d)} onClick={() => pick(d)}>
              {+d.slice(8)}
            </button>
          ) : (
            <div key={i} />
          )
        )}
      </div>
      <div className="muted sm" style={{ textAlign: 'center' }}>
        {mode === 'multi'
          ? `${dates.length} date(s) selected`
          : from
          ? `From ${from}${to ? ' to ' + to : ' — tap an end date (optional)'}`
          : 'Tap a start date'}
      </div>
    </div>
  );
}
