import { useState } from 'react';
import TaskForm from '../components/TaskForm';
import { useStore } from '../store';
import { recurSummary } from '../logic';
import { isNative, scheduleTest } from '../notify';
import { startAlarm } from '../alarm';

export default function TasksPage() {
  const { tasks } = useStore();
  const [edit, setEdit] = useState(undefined); // undefined=closed, null=new, task=edit

  async function test() {
    if (isNative) {
      try {
        await scheduleTest();
        alert('Test alarm in 10 seconds. Lock your phone or leave the app to hear the notification sound.');
      } catch (e) {
        alert('Could not schedule: ' + e);
      }
    } else {
      alert('Alarm will ring in 5 seconds');
      setTimeout(startAlarm, 5000);
    }
  }

  return (
    <div className="page">
      <div className="row between">
        <h2 style={{ margin: 0 }}>My tasks</h2>
        <button className="btn sm2" onClick={test}>🔔 Test alarm</button>
      </div>
      {!tasks.length && (
        <div className="empty">
          <p>No tasks yet.</p>
          <p className="muted">Tap + to create your first task, then plan it on a day in the Calendar tab.</p>
        </div>
      )}
      {tasks.map((t) => (
        <div key={t.id} className="card tap" onClick={() => setEdit(t)}>
          <b>{t.title}</b>
          {t.goal && <div className="muted sm">🎯 {t.goal}</div>}
          <div className="tags">
            <span>{recurSummary(t)}</span>
            {t.recurring?.enabled && t.recurring.setTime && <span>⏰ {t.recurring.start}–{t.recurring.end}</span>}
            {t.subtasks?.enabled && <span>☑ {t.subtasks.type} ({t.subtasks.items.length})</span>}
            <span>📏 {t.metric.type}</span>
            {t.tracker && <span>📈 tracked</span>}
          </div>
        </div>
      ))}
      <button className="fab" onClick={() => setEdit(null)}>+</button>
      {edit !== undefined && <TaskForm task={edit} onClose={() => setEdit(undefined)} />}
    </div>
  );
}
