-- Migration 002: System zarządzania zadaniami + dropbox + kalendarz
-- Wklej w Supabase SQL Editor

-- 0. Supabase Storage bucket (przez Dashboard: Storage → New Bucket → camp-files → Public)
-- Lub SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('camp-files', 'camp-files', false);

-- 1. RBAC — Role i permisje (łatwoskalowalne)
CREATE TABLE IF NOT EXISTS campos_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE campos_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_roles_all" ON campos_roles FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO campos_roles (name, label, permissions) VALUES
('druzynowy', 'Drużynowy', '{"tasks":["view","create","edit","delete","assign","comment","upload"],"files":["view","upload","delete"],"calendar":["view","create","edit","delete"],"invite":["create"],"analytics":["view"],"camp":["view","edit"]}'),
('przyboczny', 'Przyboczny', '{"tasks":["view","edit_own","comment","upload"],"files":["view","upload"],"calendar":["view","create"],"camp":["view"]}')
ON CONFLICT (name) DO NOTHING;

-- 2. Użytkownicy zewnętrzni (przyboczni)
CREATE TABLE IF NOT EXISTS external_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text,
  phone text,
  role text REFERENCES campos_roles(name) DEFAULT 'przyboczny',
  invited_by uuid REFERENCES profiles(id),
  magic_token text UNIQUE,
  token_expires timestamptz,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE external_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_ext_users_all" ON external_users FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Zadania
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','archived')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  "column" text DEFAULT 'todo' CHECK ("column" IN ('todo','in_progress','done','archived')),
  deadline timestamptz,
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES external_users(id),
  source_tab text,
  template_id uuid,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  "order" int DEFAULT 0,
  dependencies jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_tasks_all" ON tasks FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Subtaski (checklisty)
CREATE TABLE IF NOT EXISTS task_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean DEFAULT false,
  done_by uuid REFERENCES external_users(id),
  done_at timestamptz,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_checklists_all" ON task_checklists FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Komentarze do zadań
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('internal','external')),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_comments_all" ON task_comments FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Załączniki do zadań
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename text NOT NULL,
  path text NOT NULL,
  size int,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_attachments_all" ON task_attachments FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Dependencies między zadaniami
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, depends_on)
);
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_deps_all" ON task_dependencies FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Szablony tablicy
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_by uuid REFERENCES profiles(id),
  tasks jsonb NOT NULL DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_templates_all" ON task_templates FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Wstaw domyślny szablon (bezpiecznie: usuń stary jeśli istnieje)
DELETE FROM task_templates WHERE is_default = true;
INSERT INTO task_templates (name, is_default, tasks) VALUES
('Domyślny szablon obozu', true, '[
  {"title":"Uzupełnij dane obozu","description":"Jednostka, kierownik, daty, miejsce","priority":"high","source_tab":"camp"},
  {"title":"Skompletuj kadrę","description":"Wychowawcy + numery telefonów","priority":"high","source_tab":"camp"},
  {"title":"Dane lokalne GPS","description":"Współrzędne + pobierz służby","priority":"medium","source_tab":"camp"},
  {"title":"Miejsce bezpieczne","description":"Schronienie awaryjne","priority":"medium","source_tab":"camp"},
  {"title":"Pismo przewodnie PSP","description":"Wniosek + opinia ppoż.","priority":"high","source_tab":"docs"},
  {"title":"Zawiadomienie o obozie","description":"Do wszystkich instytucji","priority":"high","source_tab":"docs"},
  {"title":"Lista uczestników","description":"Imiona, nazwiska, wiek","priority":"high","source_tab":"docs"},
  {"title":"Regulamin obozu","description":"Zasady dla uczestników","priority":"medium","source_tab":"docs"},
  {"title":"Jadłospis","description":"Posiłki na wszystkie dni","priority":"medium","source_tab":"jadlospis"},
  {"title":"Mapa terenu","description":"Wygeneruj + piktogramy","priority":"medium","source_tab":"map"},
  {"title":"Dziennik zajęć","description":"Dla każdego wychowawcy","priority":"medium","source_tab":"diary"},
  {"title":"Ubezpieczenie","description":"Zgłoś uczestników","priority":"high"},
  {"title":"Transport","description":"Autokar / busy / pojazdy","priority":"high"},
  {"title":"Budżet","description":"Kosztorys + składki","priority":"high"},
  {"title":"Apteczka","description":"Sprawdź i uzupełnij","priority":"medium"},
  {"title":"Sprzęt obozowy","description":"Namioty, kuchnia, narzędzia","priority":"medium"}
]');

-- 9. Pliki dropboxa (obozowe)
CREATE TABLE IF NOT EXISTS shared_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  path text NOT NULL,
  size int,
  mime_type text,
  uploaded_by uuid,
  camp_id uuid REFERENCES camps(id),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_files_all" ON shared_files FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_type text CHECK (user_type IN ('internal','external')),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_activity_all" ON activity_log FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 11. Kalendarz
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date_start date NOT NULL,
  date_end date,
  time_start time,
  time_end time,
  color text DEFAULT '#2d6a2d',
  created_by uuid REFERENCES profiles(id),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  camp_id uuid REFERENCES camps(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "cmp_calendar_all" ON calendar_events FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
