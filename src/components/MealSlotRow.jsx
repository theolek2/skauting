import { useState } from 'react'
import { FIXED_MEALS } from '../utils/defaults'
import TagInput from './TagInput'

export default function MealSlotRow({ slot, mealActivities, onChange, onDelete }) {
  const [open, setOpen] = useState(false)

  const allMeals = [
    ...FIXED_MEALS,
    ...(mealActivities || []).map(a => ({ id: a.id, name: a.name, description: a.description })),
  ]

  const selectMeal = (m) => {
    onChange({ ...slot, name: m.name, description: m.description })
    setOpen(false)
  }

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded group">
      <input type="time" value={slot.time}
        onChange={e => onChange({ ...slot, time: e.target.value })}
        className="w-24 border border-gray-300 rounded px-1.5 py-1 text-sm focus:outline-none focus:border-blue-500 shrink-0" />
      <div className="flex-1 min-w-0 relative">
        <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          placeholder="Posiłek..."
          value={slot.name}
          onChange={e => onChange({ ...slot, name: e.target.value })}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} />
        {open && (
          <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
            {allMeals.filter(m => m.name.toLowerCase().includes(slot.name.toLowerCase())).map(m => (
              <div key={m.id} onMouseDown={() => selectMeal(m)}
                className="px-3 py-1.5 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                <span className="font-medium">{m.name}</span>
                {m.description && <span className="text-gray-400 text-xs ml-2 truncate">{m.description.slice(0, 40)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <TagInput value={slot.ingredients || ''}
        onChange={val => onChange({ ...slot, ingredients: val })}
        placeholder="Składniki..." />
      <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
        placeholder="Opis / uwagi..."
        value={slot.description}
        onChange={e => onChange({ ...slot, description: e.target.value })} />
      <button onClick={onDelete}
        className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-lg leading-none mt-0.5">×</button>
    </div>
  )
}
