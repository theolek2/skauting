-- Migration 003: Kolumny dla zewnętrznych użytkowników (przyboczni)
ALTER TABLE external_users ADD COLUMN IF NOT EXISTS active boolean DEFAULT false;
ALTER TABLE external_users ADD COLUMN IF NOT EXISTS session_token text;
ALTER TABLE external_users ADD COLUMN IF NOT EXISTS camp_id uuid REFERENCES camps(id);
ALTER TABLE external_users ADD COLUMN IF NOT EXISTS robert_enabled boolean DEFAULT false;
ALTER TABLE external_users ADD COLUMN IF NOT EXISTS password_hash text;
