import { useState } from 'react'
import TasksTab from './TasksTab'
import CalendarTab from './CalendarTab'
import FilesTab from './FilesTab'

const SUBTABS = [
  { id: 'tasks',    label: 'Tablica',   icon: '📋' },
  { id: 'calendar', label: 'Kalendarz', icon: '📅' },
  { id: 'files',    label: 'Pliki',     icon: '📁' },
]

export default function ZadaniaTab({ user, meta }) {
  const [subTab, setSubTab] = useState('tasks')

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-nawigacja */}
      <div className="bg-green-800 flex shrink-0">
        {SUBTABS.map(t => (
          <button key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold transition flex items-center justify-center gap-1 ${
              subTab === t.id ? 'bg-white text-green-800' : 'text-green-300 hover:text-white'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'tasks'    && <TasksTab user={user} meta={meta} />}
      {subTab === 'calendar' && <CalendarTab user={user} meta={meta} />}
      {subTab === 'files'    && <FilesTab user={user} meta={meta} />}
    </div>
  )
}
