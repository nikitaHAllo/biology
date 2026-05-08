import { useEffect, useState } from 'react';
import { api, AdminTask, AdminCollection } from '../api';

const SOURCES = ['ege', 'fipi', 'other'] as const;
const FILE_TYPES = ['pdf', 'word', 'zip', 'other'] as const;

type Source = typeof SOURCES[number];
type FileType = typeof FILE_TYPES[number];

function emptyTaskForm() {
  return { title: '', source: 'ege' as Source, file_url: '', file_type: 'pdf' as FileType, description: '', year: '', subject: '', saving: false };
}

function emptyColForm() {
  return { title: '', source: 'ege' as Source, description: '', download_url: '', saving: false };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'tasks' | 'collections'>('tasks');

  // Task form
  const [tf, setTf] = useState(emptyTaskForm());
  // Collection form
  const [cf, setCf] = useState(emptyColForm());
  // Open collections
  const [openCols, setOpenCols] = useState<Set<number>>(new Set());
  // "Add task to collection" dropdown state: collectionId → selected taskId
  const [addToCol, setAddToCol] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [td, cd] = await Promise.all([api.getTasks(), api.getCollections()]);
      setTasks(td.tasks);
      setCollections(cd.collections);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tf.title || !tf.file_url) return;
    setTf(f => ({ ...f, saving: true }));
    try {
      await api.createTask({
        title: tf.title,
        source: tf.source,
        file_url: tf.file_url,
        file_type: tf.file_type,
        description: tf.description || undefined,
        year: tf.year ? Number(tf.year) : undefined,
        subject: tf.subject || undefined,
      });
      setTf(emptyTaskForm());
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
      setTf(f => ({ ...f, saving: false }));
    }
  }

  async function handleDeleteTask(id: number) {
    if (!confirm('Удалить задание? Оно будет убрано из всех коллекций.')) return;
    try {
      await api.deleteTask(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // ── Collection CRUD ────────────────────────────────────────────────────────
  async function handleAddCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!cf.title) return;
    setCf(f => ({ ...f, saving: true }));
    try {
      await api.createCollection({
        title: cf.title,
        source: cf.source,
        description: cf.description || undefined,
        download_url: cf.download_url || undefined,
      });
      setCf(emptyColForm());
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
      setCf(f => ({ ...f, saving: false }));
    }
  }

  async function handleDeleteCollection(id: number) {
    if (!confirm('Удалить коллекцию?')) return;
    try {
      await api.deleteCollection(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function handleAddToCollection(colId: number) {
    const taskId = Number(addToCol[colId]);
    if (!taskId) return;
    try {
      await api.addTaskToCollection(colId, taskId);
      setAddToCol(s => ({ ...s, [colId]: '' }));
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function handleRemoveFromCollection(colId: number, taskId: number) {
    try {
      await api.removeTaskFromCollection(colId, taskId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  function toggleCol(id: number) {
    setOpenCols(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Задания для скачивания</h1>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${tab === 'tasks' ? 'btn-primary' : ''}`}
          style={tab !== 'tasks' ? { background: '#eee', color: '#333' } : {}}
          onClick={() => setTab('tasks')}
        >
          📄 Задания ({tasks.length})
        </button>
        <button
          className={`btn ${tab === 'collections' ? 'btn-primary' : ''}`}
          style={tab !== 'collections' ? { background: '#eee', color: '#333' } : {}}
          onClick={() => setTab('collections')}
        >
          📦 Коллекции ({collections.length})
        </button>
      </div>

      {/* ── TASKS TAB ── */}
      {tab === 'tasks' && (
        <>
          <div className="card">
            <h2>Добавить задание</h2>
            <form onSubmit={handleAddTask}>
              <div className="form-row">
                <label>
                  Название *
                  <input value={tf.title} onChange={e => setTf(f => ({ ...f, title: e.target.value }))} required placeholder="ЕГЭ 2024 вариант 1" />
                </label>
                <label>
                  Источник *
                  <select value={tf.source} onChange={e => setTf(f => ({ ...f, source: e.target.value as Source }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </label>
                <label>
                  URL файла *
                  <input value={tf.file_url} onChange={e => setTf(f => ({ ...f, file_url: e.target.value }))} required placeholder="https://..." style={{ minWidth: 220 }} />
                </label>
                <label>
                  Тип файла
                  <select value={tf.file_type} onChange={e => setTf(f => ({ ...f, file_type: e.target.value as FileType }))}>
                    {FILE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </label>
                <label>
                  Год
                  <input type="number" value={tf.year} onChange={e => setTf(f => ({ ...f, year: e.target.value }))} placeholder="2024" style={{ width: 80 }} />
                </label>
                <label>
                  Предмет
                  <input value={tf.subject} onChange={e => setTf(f => ({ ...f, subject: e.target.value }))} placeholder="Биология" />
                </label>
                <label>
                  Описание
                  <input value={tf.description} onChange={e => setTf(f => ({ ...f, description: e.target.value }))} placeholder="Необязательно" />
                </label>
                <button type="submit" className="btn btn-primary" disabled={tf.saving} style={{ alignSelf: 'flex-end' }}>
                  {tf.saving ? '...' : '+ Задание'}
                </button>
              </div>
            </form>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Источник</th>
                <th>Тип</th>
                <th>Год</th>
                <th>Предмет</th>
                <th>Файл</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>Заданий нет</td></tr>
              )}
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td><strong>{task.title}</strong>{task.description && <div className="text-muted">{task.description}</div>}</td>
                  <td><span className="badge">{task.source.toUpperCase()}</span></td>
                  <td>{task.file_type}</td>
                  <td>{task.year ?? '—'}</td>
                  <td>{task.subject ?? '—'}</td>
                  <td>
                    <a href={task.file_url} target="_blank" rel="noreferrer" style={{ color: '#4a90d9', fontSize: 12 }}>
                      ссылка
                    </a>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── COLLECTIONS TAB ── */}
      {tab === 'collections' && (
        <>
          <div className="card">
            <h2>Добавить коллекцию</h2>
            <form onSubmit={handleAddCollection}>
              <div className="form-row">
                <label>
                  Название *
                  <input value={cf.title} onChange={e => setCf(f => ({ ...f, title: e.target.value }))} required placeholder="Варианты ЕГЭ 2024" />
                </label>
                <label>
                  Источник *
                  <select value={cf.source} onChange={e => setCf(f => ({ ...f, source: e.target.value as Source }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </label>
                <label>
                  Описание
                  <input value={cf.description} onChange={e => setCf(f => ({ ...f, description: e.target.value }))} placeholder="Необязательно" />
                </label>
                <label>
                  Ссылка для скачивания
                  <input value={cf.download_url} onChange={e => setCf(f => ({ ...f, download_url: e.target.value }))} placeholder="https://disk.yandex.ru/d/..." style={{ minWidth: 260 }} />
                </label>
                <button type="submit" className="btn btn-primary" disabled={cf.saving} style={{ alignSelf: 'flex-end' }}>
                  {cf.saving ? '...' : '+ Коллекция'}
                </button>
              </div>
            </form>
          </div>

          {collections.length === 0 && <p className="text-muted">Коллекций нет</p>}

          {collections.map(col => {
            const isOpen = openCols.has(col.id);
            const colTasks = col.tasks ?? [];
            const colTaskIds = new Set(colTasks.map(t => t.id));
            const availableTasks = tasks.filter(t => !colTaskIds.has(t.id));

            return (
              <div className="section-block" key={col.id}>
                <div className={`section-header ${isOpen ? '' : 'closed'}`} onClick={() => toggleCol(col.id)}>
                  <span>
                    <span className={`chevron ${isOpen ? 'open' : ''}`}>▶</span>
                    {' '}
                    <strong>{col.title}</strong>
                    <span className="badge" style={{ marginLeft: 8 }}>{col.source.toUpperCase()}</span>
                    {col.download_url
                      ? <span className="badge" style={{ marginLeft: 6, background: '#e6f4ea', color: '#2d7d32' }}>📎 ссылка есть</span>
                      : <span className="badge" style={{ marginLeft: 6, background: '#fce8e6', color: '#c62828' }}>нет ссылки</span>
                    }
                    {col.description && <span className="text-muted" style={{ marginLeft: 8 }}>{col.description}</span>}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDeleteCollection(col.id); }}>
                    Удалить
                  </button>
                </div>

                {isOpen && (
                  <div className="section-body">
                    {col.download_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="text-muted" style={{ fontSize: 13 }}>Ссылка:</span>
                        <a href={col.download_url} target="_blank" rel="noreferrer" style={{ color: '#4a90d9', fontSize: 13, wordBreak: 'break-all' }}>
                          {col.download_url}
                        </a>
                      </div>
                    ) : (
                      <>
                        {colTasks.length === 0 && <p className="text-muted">Заданий в коллекции нет</p>}
                        {colTasks.map(task => (
                          <div className="file-row" key={task.id}>
                            <span>
                              <strong>{task.title}</strong>
                              <span className="badge" style={{ marginLeft: 6 }}>{task.source.toUpperCase()}</span>
                              {task.year && <span className="text-muted" style={{ marginLeft: 6 }}>{task.year}</span>}
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveFromCollection(col.id, task.id)}
                            >
                              Убрать
                            </button>
                          </div>
                        ))}
                        {availableTasks.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                            <select
                              value={addToCol[col.id] ?? ''}
                              onChange={e => setAddToCol(s => ({ ...s, [col.id]: e.target.value }))}
                              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
                            >
                              <option value="">— выбрать задание —</option>
                              {availableTasks.map(t => (
                                <option key={t.id} value={t.id}>
                                  [{t.source.toUpperCase()}] {t.title}{t.year ? ` (${t.year})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleAddToCollection(col.id)}
                              disabled={!addToCol[col.id]}
                            >
                              + Добавить
                            </button>
                          </div>
                        )}
                        {availableTasks.length === 0 && tasks.length > 0 && (
                          <p className="text-muted" style={{ marginTop: 8 }}>Все задания уже в коллекции</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
