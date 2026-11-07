import { useState } from 'react';
import { Sheet, Toggle, Picker } from './ui';
import MiniCalendar from './MiniCalendar';
import { saveTask, deleteTask, newTask, uid, useStore } from '../store';
import { toMin } from '../logic';

export default function TaskForm({ task, onClose }) {
  const { tasks } = useStore();
  const [t, setT] = useState(() => (task ? JSON.parse(JSON.stringify(task)) : newTask()));
  const [pick, setPick] = useState(false);
  const r = t.recurring;
  const s = t.subtasks;
  const m = t.metric;
  const up = (k, v) => setT((x) => ({ ...x, [k]: typeof v === 'object' && !Array.isArray(v) ? { ...x[k], ...v } : v }));
  const upR = (v) => up('recurring', v);
  const upS = (v) => up('subtasks', v);
  const upM = (v) => up('metric', v);

  const setItem = (i, v) => upS({ items: s.items.map((it, k) => (k === i ? { ...it, ...v } : it)) });
  const delItem = (i) => upS({ items: s.items.filter((_, k) => k !== i) });
  const move = (i, d) => {
    const a = [...s.items];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    upS({ items: a });
  };
  const addItem = () => upS({ items: [...s.items, { id: uid(), title: '', description: '', est: '', weight: '' }] });
  const total = s.items.reduce((a, i) => a + (+i.weight || 0), 0);
  const split = () => {
    const n = s.items.length;
    if (!n) return;
    const base = Math.floor(100 / n);
    upS({ items: s.items.map((it, k) => ({ ...it, weight: k === 0 ? base + (100 - base * n) : base })) });
  };
  const changeType = (type) => {
    if (type === s.type) return;
    if (s.items.length && !confirm('Changing the type clears the current subtasks. Continue?')) return;
    upS({ type, items: [] });
  };

  function save() {
    if (!t.title.trim()) return alert('Please enter a title');
    if (r.enabled) {
      if (r.useDates) {
        if (!r.dates.length) return alert('Select at least one date on the calendar');
      } else {
        if (!r.from) return alert('Pick a start date');
        if (r.to && r.to < r.from) return alert('End date is before the start date');
      }
      if (r.setTime && toMin(r.end) <= toMin(r.start)) return alert('End time must be after start time');
    }
    if (s.enabled) {
      if (!s.items.length) return alert('Add at least one subtask or turn subtasks off');
      if (s.items.some((i) => s.type !== 'simple' && !i.title.trim())) return alert('Every subtask needs a title');
      if (s.type === 'todo' && s.useWeight && total !== 100) return alert(`Weights must total 100% (now ${total}%)`);
    }
    const out = { ...t, title: t.title.trim() };
    if (!s.enabled && out.metric.type === 'subtasks') out.metric = { type: 'complete', target: '' };
    saveTask(out);
    onClose();
  }

  const metricLabel = { time: 'Target minutes (blank = time slot length)', cost: 'Budget / target amount' };

  return (
    <Sheet
      title={task ? 'Edit task' : 'New task'}
      onClose={onClose}
      footer={
        <>
          {task && (
            <button
              className="btn danger"
              onClick={() => confirm('Delete this task and all its history?') && (deleteTask(t.id), onClose())}
            >
              Delete
            </button>
          )}
          <button className="btn" onClick={save}>
            Save task
          </button>
        </>
      }
    >
      <label className="lbl">Title</label>
      <input className="in" value={t.title} onChange={(e) => up('title', e.target.value)} placeholder="e.g. Study maths" />
      <label className="lbl">Goal</label>
      <textarea className="in" rows={2} value={t.goal} onChange={(e) => up('goal', e.target.value)} placeholder="What do you want to achieve?" />

      {/* RECURRING */}
      <div className="card">
        <Toggle on={r.enabled} onChange={(v) => upR({ enabled: v })} label="Recurring task" hint="Off = add this task to days manually" />
        {r.enabled && (
          <>
            {!r.useDates && (
              <div className="row">
                <span>Every</span>
                <input className="in sm" type="number" min="1" value={r.every} onChange={(e) => upR({ every: e.target.value })} />
                <select className="in" value={r.unit} onChange={(e) => upR({ unit: e.target.value })}>
                  <option value="day">day(s)</option>
                  <option value="week">week(s)</option>
                  <option value="month">month(s)</option>
                  <option value="year">year(s)</option>
                </select>
              </div>
            )}
            <Toggle on={r.useDates} onChange={(v) => upR({ useDates: v })} label="Not range" hint="Pick individual dates instead of a period" />
            {r.useDates ? (
              <MiniCalendar mode="multi" dates={r.dates} onChange={upR} />
            ) : (
              <MiniCalendar mode="range" from={r.from} to={r.to} onChange={upR} />
            )}
            <Toggle on={r.setTime} onChange={(v) => upR({ setTime: v })} label="Set time" hint="Same time on every day (editable per day)" />
            {r.setTime && (
              <div className="row">
                <input className="in" type="time" value={r.start} onChange={(e) => upR({ start: e.target.value })} />
                <span>to</span>
                <input className="in" type="time" value={r.end} onChange={(e) => upR({ end: e.target.value })} />
              </div>
            )}
            <Toggle
              on={r.alwaysRemind}
              onChange={(v) => upR({ alwaysRemind: v })}
              label="Always remind"
              hint="Alarm on every date (needs a time)"
              disabled={!r.setTime}
            />
          </>
        )}
      </div>

      {/* SUBTASKS */}
      <div className="card">
        <Toggle on={s.enabled} onChange={(v) => upS({ enabled: v })} label="Subtasks" />
        {s.enabled && (
          <>
            <div className="seg">
              {[
                ['sequence', 'Sequence'],
                ['todo', 'To-do list'],
                ['simple', 'Simple'],
              ].map(([k, l]) => (
                <button key={k} className={s.type === k ? 'on' : ''} onClick={() => changeType(k)}>
                  {l}
                </button>
              ))}
            </div>

            {s.type === 'simple' ? (
              <>
                {s.items.map((it, i) => (
                  <div className="row" key={it.id}>
                    <b style={{ flex: 1 }}>{it.title}</b>
                    <button className="ghost" onClick={() => delItem(i)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button className="btn ghost-b" onClick={() => setPick(true)}>
                  + Pick from my tasks
                </button>
              </>
            ) : (
              <>
                {s.type === 'todo' && (
                  <>
                    <Toggle on={s.useWeight} onChange={(v) => upS({ useWeight: v })} label="Weightage" hint="Divide 100% between subtasks" />
                    {s.useWeight && (
                      <div className="row">
                        <span className={total === 100 ? 'ok' : 'bad'}>Total {total}/100%</span>
                        <button className="btn sm2" onClick={split}>
                          Split evenly
                        </button>
                      </div>
                    )}
                  </>
                )}
                {s.items.map((it, i) => (
                  <div className="box" key={it.id}>
                    <div className="row">
                      <span className="badge">{s.type === 'sequence' ? i + 1 : '☐'}</span>
                      <input className="in" placeholder="Title" value={it.title} onChange={(e) => setItem(i, { title: e.target.value })} />
                      {s.type === 'sequence' && (
                        <>
                          <button className="ghost" onClick={() => move(i, -1)}>
                            ↑
                          </button>
                          <button className="ghost" onClick={() => move(i, 1)}>
                            ↓
                          </button>
                        </>
                      )}
                      <button className="ghost" onClick={() => delItem(i)}>
                        ✕
                      </button>
                    </div>
                    <input className="in" placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                    {s.type === 'sequence' && (
                      <input className="in" type="number" min="0" placeholder="Estimated minutes (optional)" value={it.est} onChange={(e) => setItem(i, { est: e.target.value })} />
                    )}
                    {s.type === 'todo' && s.useWeight && (
                      <input className="in" type="number" min="0" max="100" placeholder="Weight %" value={it.weight} onChange={(e) => setItem(i, { weight: e.target.value })} />
                    )}
                  </div>
                ))}
                <button className="btn ghost-b" onClick={addItem}>
                  + Add {s.type === 'sequence' ? 'step' : 'item'}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* METRIC */}
      <div className="card">
        <label className="lbl">Progress metric</label>
        <select className="in" value={m.type} onChange={(e) => upM({ type: e.target.value })}>
          <option value="complete">Complete or not</option>
          <option value="time">Time allotted (timer)</option>
          <option value="subtasks" disabled={!s.enabled}>
            Subtasks {s.enabled ? '' : '(enable subtasks)'}
          </option>
          <option value="cost">Cost</option>
          <option value="percent">Percentage entered by me</option>
        </select>
        {metricLabel[m.type] && (
          <input className="in" type="number" min="0" placeholder={metricLabel[m.type]} value={m.target} onChange={(e) => upM({ target: e.target.value })} />
        )}
      </div>

      <div className="card">
        <Toggle on={t.tracker} onChange={(v) => up('tracker', v)} label="Tracker" hint="Show streaks, total time & stats in the Tracker tab" />
      </div>

      {pick && (
        <Picker
          title="Pick subtasks"
          tasks={tasks.filter((x) => x.id !== t.id && !s.items.some((i) => i.refTaskId === x.id))}
          cta="Add as subtasks"
          onClose={() => setPick(false)}
          onDone={(ids) => {
            upS({
              items: [
                ...s.items,
                ...ids.map((id) => ({ id: uid(), refTaskId: id, title: tasks.find((x) => x.id === id)?.title || '' })),
              ],
            });
            setPick(false);
          }}
        />
      )}
    </Sheet>
  );
}
