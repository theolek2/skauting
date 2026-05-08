import { useState } from 'react'
import SlotRow from './SlotRow'
import { makeSlot } from '../utils/defaults'

export default function DayCard({ day, index, activities, templateSlots = [], onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)

  const addSlot = () => {
    const lastTime = day.slots.length > 0 ? day.slots[day.slots.length - 1].time : ''
    onChange({ ...day, slots: [...day.slots, makeSlot('', lastTime)] })
  }

  const updateSlot = (slotId, updated) => {
    onChange({ ...day, slots: day.slots.map(s => s.id === slotId ? updated : s) })
  }

  const deleteSlot = (slotId) => {
    onChange({ ...day, slots: day.slots.filter(s => s.id !== slotId) })
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mb-4">
      {/* Nagłówek dnia */}
      <div className="flex items-center gap-3 bg-green-700 px-4 py-2.5">
        <button onClick={() => setCollapsed(c => !c)}
          className="text-white/70 hover:text-white text-lg w-5 text-center">
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-white font-bold text-sm whitespace-nowrap">Dzień {index + 1}</span>
        <input
          className="flex-1 bg-transparent border-b border-white/40 text-white text-sm placeholder-white/50 focus:outline-none focus:border-white"
          placeholder="Tytuł dnia (opcjonalnie)..."
          value={day.label}
          onChange={e => onChange({ ...day, label: e.target.value })}
        />
        <button onClick={onDelete}
          className="text-white/50 hover:text-red-300 text-sm ml-2">
          🗑 Usuń dzień
        </button>
      </div>

      {!collapsed && (
        <div className="p-2">
          {/* Nagłówki kolumn */}
          <div className="flex gap-2 px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span className="w-24 shrink-0">Godzina</span>
            <span className="flex-1">Zajęcie</span>
            <span className="flex-1">Opis / uwagi</span>
            <span className="w-5"></span>
          </div>

          {/* Sloty szablonu (tylko do odczytu) */}
          {templateSlots.length > 0 && (
            <div className="mb-1">
              {templateSlots.map(slot => (
                <div key={slot.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-green-50 border border-green-100 mb-0.5">
                  <span className="w-24 shrink-0 text-xs text-green-700 font-mono">{slot.time || '—:——'}</span>
                  <span className="flex-1 text-sm text-green-900">🔄 {slot.name}</span>
                  <span className="flex-1 text-xs text-gray-400 truncate">{slot.description}</span>
                  <span className="w-5"></span>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-200 my-2" />
            </div>
          )}

          {/* Sloty własne dnia */}
          {day.slots.length === 0 && templateSlots.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Brak zajęć — kliknij „+ Dodaj zajęcie"
            </p>
          )}
          {day.slots.map(slot => (
            <SlotRow
              key={slot.id}
              slot={slot}
              activities={activities}
              onChange={updated => updateSlot(slot.id, updated)}
              onDelete={() => deleteSlot(slot.id)}
            />
          ))}

          <button
            onClick={addSlot}
            className="mt-2 w-full text-sm text-green-700 border border-dashed border-green-400 rounded-lg py-1.5 hover:bg-green-50 transition"
          >
            + Dodaj zajęcie
          </button>
        </div>
      )}
    </div>
  )
}
