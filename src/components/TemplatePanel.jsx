import { useState } from 'react'
import { FIXED_ACTIVITIES, makeSlot } from '../utils/defaults'

export default function TemplatePanel({ slots, onChange }) {
  const [open, setOpen] = useState(true)

  const addSlot = (name = '', description = '') => {
    onChange([...slots, makeSlot(name, '', description)])
  }

  const updateSlot = (id, patch) => {
    onChange(slots.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const deleteSlot = (id) => {
    onChange(slots.filter(s => s.id !== id))
  }

  // Szybkie dodanie stałego elementu do szablonu
  const quickAdd = (activity) => {
    const already = slots.some(s => s.name === activity.name)
    if (already) return
    addSlot(activity.name, activity.description)
  }

  return (
    <div className="border border-green-300 rounded-xl bg-green-50 overflow-hidden mb-4">
      {/* Nagłówek */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-green-700 text-white"
      >
        <span className="font-bold text-sm flex items-center gap-2">
          🔄 Powtarzaj codziennie
          {slots.length > 0 && (
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {slots.length}
            </span>
          )}
        </span>
        <span className="text-white/70 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-3">
          <p className="text-xs text-green-800 mb-3">
            Te zajęcia pojawią się <b>na początku każdego dnia</b> automatycznie.
          </p>

          {/* Szybkie dodawanie stałych */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dodaj szybko:</p>
            <div className="flex flex-wrap gap-1.5">
              {FIXED_ACTIVITIES.map(f => {
                const added = slots.some(s => s.name === f.name)
                return (
                  <button
                    key={f.id}
                    onClick={() => added ? deleteSlot(slots.find(s => s.name === f.name)?.id) : quickAdd(f)}
                    className={`text-xs px-2 py-1 rounded-full border transition ${
                      added
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-500 hover:text-green-700'
                    }`}
                  >
                    {added ? '✓ ' : '+ '}{f.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lista slotów szablonu */}
          {slots.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kolejność i godziny:</p>
              {slots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-green-200 group">
                  <span className="text-green-600 text-xs w-4 shrink-0">🔄</span>
                  <input
                    type="time"
                    value={slot.time}
                    onChange={e => updateSlot(slot.id, { time: e.target.value })}
                    className="w-22 border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-green-400"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{slot.name}</span>
                  {/* Strzałki do zmiany kolejności */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    {i > 0 && (
                      <button
                        onClick={() => {
                          const arr = [...slots]
                          ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
                          onChange(arr)
                        }}
                        className="text-gray-400 hover:text-gray-700 text-xs px-1"
                      >↑</button>
                    )}
                    {i < slots.length - 1 && (
                      <button
                        onClick={() => {
                          const arr = [...slots]
                          ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
                          onChange(arr)
                        }}
                        className="text-gray-400 hover:text-gray-700 text-xs px-1"
                      >↓</button>
                    )}
                    <button
                      onClick={() => deleteSlot(slot.id)}
                      className="text-red-300 hover:text-red-600 text-xs px-1 ml-1"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dodaj własny slot do szablonu */}
          <button
            onClick={() => addSlot()}
            className="w-full text-xs text-green-700 border border-dashed border-green-400 rounded-lg py-1.5 hover:bg-green-100 transition"
          >
            + Dodaj własne zajęcie do szablonu
          </button>
        </div>
      )}
    </div>
  )
}
