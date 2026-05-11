import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signUp = (email, password) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,  // wraca na stronę po kliknięciu w link
    },
  })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Tereny ───────────────────────────────────────────────────────────────────
export async function getTerrains() {
  const { data, error } = await supabase
    .from('terrains')
    .select('*, camps(count)')
    .eq('is_public', true)
    .order('name')
  if (error) throw error
  return data || []
}

export async function addTerrain(terrain) {
  // Upewnij się że profil istnieje przed dodaniem terenu
  if (terrain.created_by) {
    await supabase.from('profiles')
      .upsert([{ id: terrain.created_by }], { onConflict: 'id', ignoreDuplicates: true })
  }
  const { data, error } = await supabase
    .from('terrains')
    .insert([terrain])
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Obozy ─────────────────────────────────────────────────────────────────────
export async function getCamps() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('camps')
    .select(`
      *,
      terrain:terrains(id, name, lat, lng, address, owner_name, owner_contact),
      organizer:profiles(display_name, organization, phone)
    `)
    .order('date_start', { ascending: false })
  if (error) {
    console.warn('getCamps error:', error.message)
    return []
  }

  // Wylicz status na podstawie dat
  return (data || []).map(camp => ({
    ...camp,
    status: camp.date_end < today ? 'ended'
          : camp.date_start <= today ? 'active'
          : 'planned',
  }))
}

export async function getCampsForTerrain(terrainId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('camps')
    .select('*, organizer:profiles(display_name, organization, phone)')
    .eq('terrain_id', terrainId)
    .order('date_start', { ascending: false })
  if (error) throw error
  return (data || []).map(camp => ({
    ...camp,
    status: camp.date_end < today ? 'ended'
          : camp.date_start <= today ? 'active'
          : 'planned',
  }))
}

export async function addCamp(camp) {
  // Upewnij się że profil organizatora istnieje
  if (camp.organizer_id) {
    await supabase.from('profiles')
      .upsert([{ id: camp.organizer_id }], { onConflict: 'id', ignoreDuplicates: true })
  }
  const { data, error } = await supabase
    .from('camps')
    .insert([camp])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCamp(id, patch) {
  const { error } = await supabase.from('camps').update(patch).eq('id', id)
  if (error) throw error
}

// ── Profile ───────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function upsertProfile(profile) {
  const { error } = await supabase.from('profiles').upsert([profile])
  if (error) throw error
}

// ── Dane obozu (meta) w Supabase ─────────────────────────────────────────────
export async function saveCampMeta(userId, meta) {
  const { error } = await supabase
    .from('profiles')
    .update({ camp_meta: meta })
    .eq('id', userId)
  if (error) throw error
}

export async function loadCampMeta(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('camp_meta')
    .eq('id', userId)
    .single()
  return data?.camp_meta || null
}
