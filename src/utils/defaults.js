export const FIXED_ACTIVITIES = [
  { id: 'f1',  name: 'Pobudka',           description: '' },
  { id: 'f2',  name: 'Toaleta poranna',   description: '' },
  { id: 'f3',  name: 'Ranna rozgrzewka',  description: '' },
  { id: 'f4',  name: 'Śniadanie',         description: '' },
  { id: 'f5',  name: 'Apel początkowy',   description: '' },
  { id: 'f6',  name: 'Msza',              description: '' },
  { id: 'f7',  name: 'Podwieczorek',      description: '' },
  { id: 'f8',  name: 'Obiad',             description: '' },
  { id: 'f9',  name: 'Czas dla siebie',   description: '' },
  { id: 'f10', name: 'Kolacja',           description: '' },
  { id: 'f11', name: 'Apel końcowy',      description: '' },
  { id: 'f12', name: 'Wieczorne ognisko', description: '' },
  { id: 'f13', name: 'Apel',             description: '' },
  { id: 'f14', name: 'Cisza nocna',       description: '' },
]

export function makeDay(index) {
  return {
    id: `day_${Date.now()}_${index}`,
    label: '',
    slots: [],
  }
}

export function makeSlot(activityName = '', time = '', description = '') {
  return {
    id: `slot_${Date.now()}_${Math.random()}`,
    time,
    name: activityName,
    description,
  }
}
