import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask, logActivity, getActivityFeed, getDefaultTemplate, supabase } from '../lib/supabase'

const COLUMNS = [
  { id: 'todo',       label: 'Do zrobienia',  color: 'bg-gray-100',    dot: '⚪' },
  { id: 'in_progress', label: 'W trakcie',    color: 'bg-blue-50',    dot: '🔵' },
  { id: 'done',       label: 'Zrobione',      color: 'bg-green-50',   dot: '🟢' },
  { id: 'archived',   label: 'Archiwum',       color: 'bg-gray-200/50', dot: '📦' },
]

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#6b7280' }
const PRIORITY_LABELS = { urgent: 'Pilne', high: 'Wysoki', medium: 'Średni', low: 'Niski' }

function TaskCard({ task, onMove, onClick }) {
  const deadline = task.deadline ? new Date(task.deadline) : null
  const isOverdue = deadline && deadline < new Date() && task.column !== 'done' && task.column !== 'archived'

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('fromColumn', task.column) }}
      onClick={() => onClick(task)}
      className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:shadow-md hover:border-green-400 transition mb-2 text-sm"
    >
      <div className="flex items-start gap-2">
        <span className="text-xs mt-0.5" style={{ color: PRIORITY_COLORS[task.priority] || '#888' }}>●</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 truncate">{task.title}</div>
          {task.description && <div className="text-xs text-gray-400 truncate mt-0.5">{task.description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
        {deadline && (
          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
            📅 {deadline.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            {isOverdue && ' (przekroczony)'}
          </span>
        )}
        {task.assigned?.display_name && (
          <span className="bg-gray-100 rounded-full px-2 py-0.5">{task.assigned.display_name}</span>
        )}
        {(task.checklists || []).length > 0 && (
          <span>✅ {task.checklists.filter(c => c.done).length}/{task.checklists.length}</span>
        )}
      </div>
    </div>
  )
}

function InviteModal({ onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [guestLogin, setGuestLogin] = useState(null)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/create-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd')
      setGuestLogin({ email: data.email, password: data.password })
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4">
      {guestLogin ? (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-bold text-gray-800 mb-2">Konto utworzone!</h3>
          <p className="text-xs text-gray-500 mb-3">Przekaż dane logowania przybocznemu</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-sm text-left space-y-1.5">
            <div><b className="text-gray-500">Email:</b> <span className="text-gray-800 select-all">{guestLogin.email}</span></div>
            <div><b className="text-gray-500">Hasło:</b> <span className="text-green-700 font-mono font-bold select-all">{guestLogin.password}</span></div>
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-200">Przyboczny loguje się tym hasłem, potem może je zmienić</div>
          </div>
          <button onClick={() => { onInvited(); onClose() }}
            className="w-full bg-green-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-800 transition">
            OK, zamknij
          </button>
        </div>
      ) : (
        <form onSubmit={handle} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <h3 className="font-bold text-gray-800 mb-4">📨 Zaproś przybocznego</h3>
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            placeholder="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Anuluj</button>
            <button type="submit" disabled={loading} className="flex-1 bg-green-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-800 disabled:opacity-50">
              {loading ? 'Tworzę...' : 'Utwórz konto'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function TasksTab({ user, meta, isDruzynowy = true }) {
  const [tasks, setTasks] = useState([])
  const [feed, setFeed] = useState([])
  const [filterPerson, setFilterPerson] = useState('')
  const [filterDeadline, setFilterDeadline] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [addingCol, setAddingCol] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [members, setMembers] = useState([])

  const load = useCallback(async () => {
    const t = await getTasks()
    setTasks(t)
    const f = await getActivityFeed(20)
    setFeed(f)
    const { data: ext } = await supabase.from('external_users').select('id,display_name,email').eq('active', true)
    setMembers(ext || [])
  }, [])

  useEffect(() => { load() }, [load])

  const handleDrop = async (e, toColumn) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const fromColumn = e.dataTransfer.getData('fromColumn')
    if (fromColumn === toColumn) return
    await updateTask(taskId, { column: toColumn, status: toColumn === 'done' ? 'done' : toColumn === 'archived' ? 'archived' : 'in_progress' })
    await logActivity(`task_move_${toColumn}`, { taskId, from: fromColumn, to: toColumn })
    load()
  }

  const handleAddTask = async () => {
    const title = newTitle.trim()
    if (!title) return
    await createTask({
      title,
      column: addingCol,
      created_by: user?.id,
      assigned_to: newAssignee || null,
    })
    await logActivity('task_created', { title, column: addingCol })
    setNewTitle('')
    setNewAssignee('')
    setAddingCol(null)
    load()
  }

  const handleLoadTemplate = async () => {
    const tmpl = await getDefaultTemplate()
    if (!tmpl?.tasks) return alert('Brak szablonu')
    for (const t of tmpl.tasks) {
      await createTask({ ...t, column: 'todo', created_by: user?.id })
    }
    await logActivity('template_loaded', { name: tmpl.name })
    load()
  }

  // Filtrowanie
  let filtered = tasks
  if (filterPerson) {
    filtered = filtered.filter(t => t.assigned?.display_name?.toLowerCase().includes(filterPerson.toLowerCase()))
  }
  if (filterDeadline) {
    const d = new Date(filterDeadline)
    filtered = filtered.filter(t => t.deadline && new Date(t.deadline) <= d)
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      {/* Pasek narzędzi */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0">
        <h2 className="font-bold text-gray-800 text-sm">📋 Zadania</h2>
        <input className="border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-green-400 w-36"
          placeholder="Filtruj osobę..." value={filterPerson} onChange={e => setFilterPerson(e.target.value)} />
        <input type="date" className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-green-400"
          value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)} />
        {(filterPerson || filterDeadline) && (
          <button onClick={() => { setFilterPerson(''); setFilterDeadline('') }} className="text-xs text-gray-400 underline">Wyczyść</button>
        )}
        <div className="ml-auto flex gap-2">
          {isDruzynowy && (<>
            <button onClick={handleLoadTemplate}
              className="text-xs border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50">📋 Szablon obozu</button>
            <button onClick={() => setShowInvite(true)}
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-800">+ Zaproś przybocznego</button>
          </>)}
        </div>
      </div>

      {/* Kolumny */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4">
        {COLUMNS.filter(c => c.id !== 'archived' || showArchived).map(col => {
          const colTasks = filtered.filter(t => t.column === col.id)
          return (
            <div key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex-1 min-w-[240px] max-w-[340px] rounded-xl ${col.color} p-3 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-700">{col.dot} {col.label}</span>
                <span className="text-xs text-gray-400">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
                ))}

                {addingCol === col.id ? (
                  <div className="bg-white border border-green-300 rounded-xl p-2 space-y-1.5">
                    <input autoFocus className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                      placeholder="Nazwa zadania..." value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') setAddingCol(null) }} />
                    {members.length > 0 && (
                      <select className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5" value={newAssignee}
                        onChange={e => setNewAssignee(e.target.value)}>
                        <option value="">Bez przypisania</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.display_name || m.email}</option>
                        ))}
                      </select>
                    )}
                    <div className="flex gap-1">
                      <button onClick={handleAddTask} className="flex-1 bg-green-700 text-white text-xs rounded-lg py-1 font-bold">Dodaj</button>
                      <button onClick={() => setAddingCol(null)} className="text-xs px-2 text-gray-400">×</button>
                    </div>
                  </div>
                ) : isDruzynowy ? (
                  <button onClick={() => setAddingCol(col.id)}
                    className="mt-2 text-xs text-gray-400 hover:text-green-600 border border-dashed border-gray-300 rounded-lg py-1.5 hover:border-green-400 transition">
                    + Dodaj zadanie
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Przycisk archiwum */}
      {!showArchived && (
        <button onClick={() => setShowArchived(true)}
          className="text-xs text-gray-400 text-center py-2 border-t border-gray-200 hover:text-green-600">
          📦 Pokaż archiwum
        </button>
      )}

      {/* Activity Feed */}
      <div className="border-t border-gray-200 bg-white px-4 py-2 shrink-0 max-h-32 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 mb-1">Aktywność</p>
        {feed.length === 0 ? (
          <p className="text-xs text-gray-300">Brak aktywności</p>
        ) : feed.slice(0, 10).map((a, i) => (
          <div key={i} className="text-xs text-gray-500 py-0.5">
            {new Date(a.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{a.action}
            {a.meta?.title ? ` "${a.meta.title}"` : ''}
          </div>
        ))}
      </div>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvited={() => { setShowInvite(false); load() }} />
      )}
    </div>
  )
}
