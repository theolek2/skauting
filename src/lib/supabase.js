import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

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
  let { data, error } = await supabase
    .from('terrains')
    .select('id,name,lat,lng,address,owner_name,owner_contact,owner_notes,created_by,is_public,created_at')
    .eq('is_public', true)
    .order('name')
  if (error) {
    const { data: data2, error: error2 } = await supabase
      .from('terrains')
      .select('id,name,lat,lng,address,owner_name,owner_contact,owner_notes,created_by,is_public,created_at')
      .order('name')
    if (error2) throw error2
    return data2 || []
  }
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

// Pobiera profile organizatorów przez camp_access (bez organizer_id w camps)
async function _fetchOrganizers(campIds) {
  if (!campIds.length) return {}
  const { data } = await supabase
    .from('camp_access')
    .select('camp_id, user_id')
    .in('camp_id', campIds)
  if (!data?.length) return {}
  const userIds = [...new Set(data.map(r => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, organization, phone')
    .in('id', userIds)
  const profileMap = {}
  ;(profiles || []).forEach(p => { profileMap[p.id] = p })
  const organizerMap = {}
  data.forEach(r => {
    if (!organizerMap[r.camp_id] && profileMap[r.user_id])
      organizerMap[r.camp_id] = profileMap[r.user_id]
  })
  return organizerMap
}

export async function getCamps() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('camps')
    .select('id,terrain_id,unit_name,num_teams,contact_person,contact_phone,date_start,date_end,notes,created_at, terrain:terrains(id, name, lat, lng, address, owner_name, owner_contact)')
    .order('date_start', { ascending: false })

  if (error) {
    console.warn('getCamps error:', error.message)
    return { error: error.message, camps: [] }
  }

  const campsData = data || []
  const organizerMap = await _fetchOrganizers(campsData.map(c => c.id)).catch(() => ({}))

  return {
    error: null,
    camps: campsData.map(camp => ({
      ...camp,
      organizer: organizerMap[camp.id] || null,
      status: camp.date_end < today ? 'ended'
            : camp.date_start <= today ? 'active'
            : 'planned',
    })),
  }
}

export async function getCampsForTerrain(terrainId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('camps')
    .select('id,terrain_id,unit_name,num_teams,contact_person,contact_phone,date_start,date_end,notes,created_at')
    .eq('terrain_id', terrainId)
    .order('date_start', { ascending: false })
  if (error) throw error

  const campsData = data || []
  const organizerMap = await _fetchOrganizers(campsData.map(c => c.id)).catch(() => ({}))

  return campsData.map(camp => ({
    ...camp,
    organizer: organizerMap[camp.id] || null,
    status: camp.date_end < today ? 'ended'
          : camp.date_start <= today ? 'active'
          : 'planned',
  }))
}

export async function addCamp(camp) {
  // Wyciągnij organizer_id (idzie do camp_access, nie do camps)
  const organizerId = camp.organizer_id
  const { organizer_id: _, ...campData } = camp

  // Upewnij się że profil organizatora istnieje
  if (organizerId) {
    await supabase.from('profiles')
      .upsert([{ id: organizerId }], { onConflict: 'id', ignoreDuplicates: true })
  }

  const { data, error } = await supabase
    .from('camps')
    .insert([campData])
    .select()
    .single()
  if (error) throw error

  // Powiąż organizatora z obozem przez camp_access
  if (organizerId && data) {
    await supabase.from('camp_access').upsert(
      [{ user_id: organizerId, camp_id: data.id }],
      { onConflict: 'user_id,camp_id', ignoreDuplicates: true }
    ).catch(e => console.warn('camp_access upsert:', e.message))
  }

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

// ── Składniki ────────────────────────────────────────────────────────────────
export async function getAllIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')
  if (error) { console.warn('getAllIngredients:', error.message); return [] }
  return (data || []).map(i => i.name)
}

export async function addIngredient(name) {
  const clean = name.trim().toLowerCase()
  if (!clean) return
  const { error } = await supabase
    .from('ingredients')
    .upsert([{ name: clean }], { onConflict: 'name', ignoreDuplicates: true })
  if (error) console.warn('addIngredient:', error.message)
}

export async function seedIngredients(names) {
  const rows = names.map(name => ({ name: name.trim().toLowerCase() }))
  const { error } = await supabase
    .from('ingredients')
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: true })
  if (error) console.warn('seedIngredients:', error.message)
}

// ── Użytkownicy zewnętrzni (przyboczni) ──────────────────────────────────────
export async function inviteExternalUser({ email, name, phone, role, invitedBy }) {
  const token = crypto.randomUUID()
  const { data, error } = await supabase
    .from('external_users')
    .upsert([{
      email, display_name: name, phone, role: role || 'przyboczny',
      invited_by: invitedBy, magic_token: token,
      token_expires: new Date(Date.now() + 7 * 86400000).toISOString(),
    }], { onConflict: 'email' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getExternalUserByToken(token) {
  const { data, error } = await supabase
    .from('external_users')
    .select('*, external_roles:campos_roles(permissions)')
    .eq('magic_token', token)
    .gte('token_expires', new Date().toISOString())
    .single()
  if (error || !data) return null
  return data
}

export async function updateExternalUser(id, patch) {
  const { error } = await supabase.from('external_users').update(patch).eq('id', id)
  if (error) throw error
}

// ── Zadania ───────────────────────────────────────────────────────────────────
export async function getTasks({ assignedTo, createdBy, column, campId } = {}) {
  let q = supabase.from('tasks')
    .select('*, checklists:task_checklists(*), dependencies:task_dependencies!task_id(*), assigned:external_users(id,display_name), creator:profiles!created_by(id,display_name)')
    .order('order')
    .order('created_at', { ascending: false })
  if (assignedTo) q = q.eq('assigned_to', assignedTo)
  if (createdBy) q = q.eq('created_by', createdBy)
  if (column) q = q.eq('column', column)
  const { data, error } = await q
  if (error) { console.warn('getTasks error:', error.message); return [] }
  return data || []
}

export async function createTask(task) {
  const { data, error } = await supabase.from('tasks').insert([task]).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id, patch) {
  const { error } = await supabase.from('tasks').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function toggleChecklistItem(itemId, done, userId) {
  const patch = { done, done_at: done ? new Date().toISOString() : null, done_by: done ? userId : null }
  const { error } = await supabase.from('task_checklists').update(patch).eq('id', itemId)
  if (error) throw error
}

export async function addChecklistItem(taskId, item) {
  const { data, error } = await supabase.from('task_checklists').insert([{ task_id: taskId, ...item }]).select().single()
  if (error) throw error
  return data
}

export async function addTaskComment(taskId, comment) {
  const { data, error } = await supabase.from('task_comments').insert([{ task_id: taskId, ...comment }]).select().single()
  if (error) throw error
  return data
}

export async function getTaskComments(taskId) {
  const { data } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at')
  return data || []
}

// ── Pliki (dropbox) ──────────────────────────────────────────────────────────
export async function uploadSharedFile(file) {
  const { data, error } = await supabase.from('shared_files').insert([file]).select().single()
  if (error) throw error
  return data
}

export async function getSharedFiles(campId) {
  const { data } = await supabase.from('shared_files').select('*').eq('camp_id', campId).order('created_at', { ascending: false })
  return data || []
}

export async function deleteSharedFile(id) {
  const { error } = await supabase.from('shared_files').delete().eq('id', id)
  if (error) throw error
}

// ── Kalendarz ─────────────────────────────────────────────────────────────────
export async function getCalendarEvents({ year, month, campId } = {}) {
  let q = supabase.from('calendar_events').select('*').order('date_start')
  if (campId) q = q.eq('camp_id', campId)
  const { data } = await q
  return data || []
}

export async function createCalendarEvent(event) {
  const { data, error } = await supabase.from('calendar_events').insert([event]).select().single()
  if (error) throw error
  return data
}

export async function updateCalendarEvent(id, patch) {
  const { error } = await supabase.from('calendar_events').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCalendarEvent(id) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

// ── Szablony ──────────────────────────────────────────────────────────────────
export async function getDefaultTemplate() {
  const { data } = await supabase.from('task_templates').select('*').eq('is_default', true).single()
  return data
}

// ── Activity log ──────────────────────────────────────────────────────────────
export async function logActivity(action, meta = {}) {
  const { error } = await supabase.from('activity_log').insert([{ action, meta, user_type: 'internal' }])
  if (error) console.warn('logActivity error:', error.message)
}

export async function getActivityFeed(limit = 30) {
  const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
  return data || []
}
