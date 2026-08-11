import { useEffect, useState } from 'react';
import { api, AdminSection, AdminTopic, AdminFile } from '../api';

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface FileEditState {
  name: string;
  url: string;
  type: string;
  saving: boolean;
}

interface TopicCoinsEditState {
  price: string;
  unlocked: boolean;
  saving: boolean;
}

export default function ContentPage() {
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expanded state
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [openTopics, setOpenTopics] = useState<Set<number>>(new Set());

  // New section form
  const [nsTitle, setNsTitle] = useState('');
  const [nsSlug, setNsSlug] = useState('');
  const [nsDesc, setNsDesc] = useState('');
  const [nsIcon, setNsIcon] = useState('');
  const [nsOrder, setNsOrder] = useState('0');
  const [nsSaving, setNsSaving] = useState(false);

  // New topic: per section
  const [topicForms, setTopicForms] = useState<Record<number, { title: string; slug: string; desc: string; price: string; unlocked: boolean; saving: boolean }>>({});

  // New file: per topic
  const [fileForms, setFileForms] = useState<Record<number, { name: string; url: string; type: string; saving: boolean }>>({});

  // Edit file: per file id
  const [editingFile, setEditingFile] = useState<Record<number, FileEditState>>({});

  // Edit topic coins: per topic id
  const [editingTopicCoins, setEditingTopicCoins] = useState<Record<number, TopicCoinsEditState>>({});

  async function load() {
    setLoading(true);
    try {
      const d = await api.getSections();
      setSections(d.sections);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleSection(id: number) {
    setOpenSections(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleTopic(id: number) {
    setOpenTopics(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Section CRUD
  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    if (!nsTitle || !nsSlug) return;
    setNsSaving(true);
    try {
      await api.createSection({ title: nsTitle, slug: nsSlug, description: nsDesc || undefined, icon: nsIcon || undefined, order_index: Number(nsOrder) });
      setNsTitle(''); setNsSlug(''); setNsDesc(''); setNsIcon(''); setNsOrder('0');
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setNsSaving(false);
    }
  }

  async function handleDeleteSection(id: number) {
    if (!confirm('Удалить раздел вместе со всеми темами и файлами?')) return;
    try {
      await api.deleteSection(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // Topic CRUD
  function getTopicForm(sectionId: number) {
    return topicForms[sectionId] ?? { title: '', slug: '', desc: '', price: '0', unlocked: false, saving: false };
  }

  function setTopicField(sectionId: number, field: string, value: string | boolean) {
    setTopicForms(f => ({ ...f, [sectionId]: { ...getTopicForm(sectionId), [field]: value } }));
  }

  async function handleAddTopic(e: React.FormEvent, sectionId: number) {
    e.preventDefault();
    const form = getTopicForm(sectionId);
    if (!form.title || !form.slug) return;
    setTopicField(sectionId, 'saving', true);
    try {
      await api.createTopic({
        section_id: sectionId,
        title: form.title,
        slug: form.slug,
        description: form.desc || undefined,
        price_repcoins: Number(form.price),
        is_default_unlocked: form.unlocked,
      });
      setTopicForms(f => ({ ...f, [sectionId]: { title: '', slug: '', desc: '', price: '0', unlocked: false, saving: false } }));
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
      setTopicField(sectionId, 'saving', false);
    }
  }

  async function handleDeleteTopic(id: number) {
    if (!confirm('Удалить тему со всеми файлами?')) return;
    try {
      await api.deleteTopic(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // Topic coins editing
  function startEditTopicCoins(topic: AdminTopic) {
    setEditingTopicCoins(s => ({
      ...s,
      [topic.id]: { price: String(topic.price_repcoins), unlocked: topic.is_default_unlocked, saving: false },
    }));
  }

  function cancelEditTopicCoins(topicId: number) {
    setEditingTopicCoins(s => { const n = { ...s }; delete n[topicId]; return n; });
  }

  async function saveTopicCoins(topicId: number) {
    const state = editingTopicCoins[topicId];
    if (!state) return;
    setEditingTopicCoins(s => ({ ...s, [topicId]: { ...s[topicId], saving: true } }));
    try {
      await api.updateTopic(topicId, {
        price_repcoins: Number(state.price),
        is_default_unlocked: state.unlocked,
      });
      cancelEditTopicCoins(topicId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения');
      setEditingTopicCoins(s => ({ ...s, [topicId]: { ...s[topicId], saving: false } }));
    }
  }

  // File CRUD
  function getFileForm(topicId: number) {
    return fileForms[topicId] ?? { name: '', url: '', type: 'pdf', saving: false };
  }

  function setFileField(topicId: number, field: string, value: string) {
    setFileForms(f => ({ ...f, [topicId]: { ...getFileForm(topicId), [field]: value } }));
  }

  async function handleAddFile(e: React.FormEvent, topicId: number) {
    e.preventDefault();
    const form = getFileForm(topicId);
    if (!form.name || !form.url) return;
    setFileField(topicId, 'saving', 'true');
    try {
      await api.createFile({ topic_id: topicId, name: form.name, file_url: form.url, file_type: form.type });
      setFileForms(f => ({ ...f, [topicId]: { name: '', url: '', type: 'pdf', saving: false } }));
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
      setFileField(topicId, 'saving', 'false');
    }
  }

  async function handleDeleteFile(id: number) {
    if (!confirm('Удалить файл?')) return;
    try {
      await api.deleteFile(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  // File editing
  function startEditFile(file: AdminFile) {
    setEditingFile(s => ({
      ...s,
      [file.id]: { name: file.name, url: file.file_url, type: file.file_type, saving: false },
    }));
  }

  function cancelEditFile(fileId: number) {
    setEditingFile(s => { const n = { ...s }; delete n[fileId]; return n; });
  }

  async function saveFile(fileId: number) {
    const state = editingFile[fileId];
    if (!state) return;
    if (!state.name || !state.url) { alert('Имя и URL обязательны'); return; }
    setEditingFile(s => ({ ...s, [fileId]: { ...s[fileId], saving: true } }));
    try {
      await api.updateFile(fileId, { name: state.name, file_url: state.url, file_type: state.type });
      cancelEditFile(fileId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения');
      setEditingFile(s => ({ ...s, [fileId]: { ...s[fileId], saving: false } }));
    }
  }

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Управление контентом</h1>

      {/* Add Section Form */}
      <div className="card">
        <h2>Добавить раздел</h2>
        <form onSubmit={handleAddSection}>
          <div className="form-row">
            <label>
              Название *
              <input
                value={nsTitle}
                onChange={e => { setNsTitle(e.target.value); if (!nsSlug) setNsSlug(slugify(e.target.value)); }}
                required
                placeholder="Клетка и ткани"
              />
            </label>
            <label>
              Slug *
              <input value={nsSlug} onChange={e => setNsSlug(e.target.value)} required placeholder="kletka-i-tkani" />
            </label>
            <label>
              Описание
              <input value={nsDesc} onChange={e => setNsDesc(e.target.value)} placeholder="Необязательно" />
            </label>
            <label>
              Иконка
              <input value={nsIcon} onChange={e => setNsIcon(e.target.value)} placeholder="🧬" style={{ width: 80 }} />
            </label>
            <label>
              Порядок
              <input type="number" value={nsOrder} onChange={e => setNsOrder(e.target.value)} style={{ width: 70 }} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={nsSaving} style={{ alignSelf: 'flex-end' }}>
              {nsSaving ? '...' : '+ Раздел'}
            </button>
          </div>
        </form>
      </div>

      {sections.length === 0 && <p className="text-muted">Разделов пока нет</p>}

      {/* Section Tree */}
      {sections.map(section => {
        const isOpen = openSections.has(section.id);
        const tf = getTopicForm(section.id);
        return (
          <div className="section-block" key={section.id}>
            <div className={`section-header ${isOpen ? '' : 'closed'}`} onClick={() => toggleSection(section.id)}>
              <span>
                <span className={`chevron ${isOpen ? 'open' : ''}`}>▶</span>
                {' '}
                <strong>{section.icon} {section.title}</strong>
                <span className="text-muted" style={{ marginLeft: 8 }}>/{section.slug}</span>
                <span className="badge" style={{ marginLeft: 8 }}>{section.topics?.length ?? 0} тем</span>
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={e => { e.stopPropagation(); handleDeleteSection(section.id); }}
              >
                Удалить
              </button>
            </div>

            {isOpen && (
              <div className="section-body">
                {/* Add topic form */}
                <div className="card" style={{ background: '#f9f9f9', marginBottom: 12 }}>
                  <h3>Добавить тему в «{section.title}»</h3>
                  <form onSubmit={e => handleAddTopic(e, section.id)}>
                    <div className="form-row">
                      <label>
                        Название *
                        <input
                          value={tf.title}
                          onChange={e => { setTopicField(section.id, 'title', e.target.value); if (!tf.slug) setTopicField(section.id, 'slug', slugify(e.target.value)); }}
                          required placeholder="Митоз"
                        />
                      </label>
                      <label>
                        Slug *
                        <input value={tf.slug} onChange={e => setTopicField(section.id, 'slug', e.target.value)} required placeholder="mitoz" />
                      </label>
                      <label>
                        Описание
                        <input value={tf.desc} onChange={e => setTopicField(section.id, 'desc', e.target.value)} placeholder="Необязательно" />
                      </label>
                      <label>
                        Цена (монеты)
                        <input type="number" value={tf.price} onChange={e => setTopicField(section.id, 'price', e.target.value)} style={{ width: 80 }} />
                      </label>
                      <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={tf.unlocked} onChange={e => setTopicField(section.id, 'unlocked', e.target.checked)} />
                        Бесплатно
                      </label>
                      <button type="submit" className="btn btn-primary" disabled={tf.saving} style={{ alignSelf: 'flex-end' }}>
                        {tf.saving ? '...' : '+ Тема'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Topics */}
                {(!section.topics || section.topics.length === 0) && <p className="text-muted">Тем нет</p>}
                {(section.topics ?? []).map((topic: AdminTopic) => {
                  const isTopicOpen = openTopics.has(topic.id);
                  const ff = getFileForm(topic.id);
                  const coinsEdit = editingTopicCoins[topic.id];
                  return (
                    <div className="topic-block" key={topic.id}>
                      <div className="topic-header" onClick={() => toggleTopic(topic.id)}>
                        <span>
                          <span className={`chevron ${isTopicOpen ? 'open' : ''}`}>▶</span>
                          {' '}
                          <strong>{topic.title}</strong>
                          <span className="text-muted" style={{ marginLeft: 6 }}>/{topic.slug}</span>

                          {/* Coins badge / inline edit */}
                          {coinsEdit ? (
                            <span
                              style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="number"
                                value={coinsEdit.price}
                                onChange={e => setEditingTopicCoins(s => ({ ...s, [topic.id]: { ...s[topic.id], price: e.target.value } }))}
                                style={{ width: 70, padding: '2px 4px', fontSize: 12 }}
                                min={0}
                              />
                              <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <input
                                  type="checkbox"
                                  checked={coinsEdit.unlocked}
                                  onChange={e => setEditingTopicCoins(s => ({ ...s, [topic.id]: { ...s[topic.id], unlocked: e.target.checked } }))}
                                />
                                бесплатно
                              </label>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={coinsEdit.saving}
                                onClick={() => saveTopicCoins(topic.id)}
                                style={{ padding: '2px 8px', fontSize: 12 }}
                              >
                                {coinsEdit.saving ? '...' : 'Сохранить'}
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => cancelEditTopicCoins(topic.id)}
                                style={{ padding: '2px 8px', fontSize: 12 }}
                              >
                                Отмена
                              </button>
                            </span>
                          ) : (
                            <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {topic.is_default_unlocked
                                ? <span className="badge" style={{ background: '#e8f8e8', color: '#2a8a2a' }}>бесплатно</span>
                                : <span className="badge">{topic.price_repcoins} монет</span>
                              }
                              <button
                                className="btn btn-sm"
                                title="Изменить цену"
                                onClick={e => { e.stopPropagation(); startEditTopicCoins(topic); }}
                                style={{ padding: '1px 6px', fontSize: 11 }}
                              >
                                ✏️
                              </button>
                            </span>
                          )}

                          <span className="badge" style={{ marginLeft: 6 }}>{topic.files?.length ?? 0} файлов</span>
                        </span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={e => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                        >
                          Удалить
                        </button>
                      </div>

                      {isTopicOpen && (
                        <div className="topic-body">
                          {/* Files list */}
                          {(topic.files ?? []).map((file: AdminFile) => {
                            const fe = editingFile[file.id];
                            return (
                              <div key={file.id}>
                                {fe ? (
                                  /* Edit mode */
                                  <div className="file-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                                    <input
                                      value={fe.name}
                                      onChange={e => setEditingFile(s => ({ ...s, [file.id]: { ...s[file.id], name: e.target.value } }))}
                                      placeholder="Имя файла"
                                      style={{ flex: '1 1 140px', minWidth: 120 }}
                                    />
                                    <input
                                      value={fe.url}
                                      onChange={e => setEditingFile(s => ({ ...s, [file.id]: { ...s[file.id], url: e.target.value } }))}
                                      placeholder="URL"
                                      style={{ flex: '2 1 220px', minWidth: 160 }}
                                    />
                                    <select
                                      value={fe.type}
                                      onChange={e => setEditingFile(s => ({ ...s, [file.id]: { ...s[file.id], type: e.target.value } }))}
                                      style={{ flex: '0 0 90px' }}
                                    >
                                      <option value="pdf">PDF</option>
                                      <option value="word">Word</option>
                                      <option value="zip">ZIP</option>
                                      <option value="other">Другой</option>
                                    </select>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      disabled={fe.saving}
                                      onClick={() => saveFile(file.id)}
                                    >
                                      {fe.saving ? '...' : 'Сохранить'}
                                    </button>
                                    <button
                                      className="btn btn-sm"
                                      onClick={() => cancelEditFile(file.id)}
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                ) : (
                                  /* View mode */
                                  <div className="file-row">
                                    <span>
                                      <strong>{file.name}</strong>
                                      <span className="badge" style={{ marginLeft: 6 }}>{file.file_type}</span>
                                      <a href={file.file_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 12, color: '#4a90d9' }}>
                                        ссылка
                                      </a>
                                    </span>
                                    <span style={{ display: 'flex', gap: 4 }}>
                                      <button className="btn btn-sm" onClick={() => startEditFile(file)} title="Редактировать">✏️</button>
                                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFile(file.id)}>✕</button>
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {(!topic.files || topic.files.length === 0) && <p className="text-muted" style={{ marginBottom: 8 }}>Файлов нет</p>}

                          {/* Add file form */}
                          <form onSubmit={e => handleAddFile(e, topic.id)} style={{ marginTop: 8 }}>
                            <div className="form-row">
                              <label>
                                Имя файла *
                                <input value={ff.name} onChange={e => setFileField(topic.id, 'name', e.target.value)} required placeholder="Теория.pdf" />
                              </label>
                              <label>
                                URL файла *
                                <input value={ff.url} onChange={e => setFileField(topic.id, 'url', e.target.value)} required placeholder="https://..." style={{ minWidth: 220 }} />
                              </label>
                              <label>
                                Тип
                                <select value={ff.type} onChange={e => setFileField(topic.id, 'type', e.target.value)}>
                                  <option value="pdf">PDF</option>
                                  <option value="word">Word</option>
                                  <option value="zip">ZIP</option>
                                  <option value="other">Другой</option>
                                </select>
                              </label>
                              <button type="submit" className="btn btn-primary" disabled={!!ff.saving} style={{ alignSelf: 'flex-end' }}>
                                {ff.saving ? '...' : '+ Файл'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
