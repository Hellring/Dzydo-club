-- Tenant schema template: create basic tenant tables (athletes, groups, tournaments, matches)
-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS athletes (
  id SERIAL PRIMARY KEY,
  external_id UUID DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  weight_kg REAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_a INTEGER REFERENCES athletes(id) ON DELETE SET NULL,
  athlete_b INTEGER REFERENCES athletes(id) ON DELETE SET NULL,
  winner INTEGER NULL,
  result JSONB NULL,
  round INTEGER DEFAULT 1,
  slot INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add any tenant-specific indexes
CREATE INDEX IF NOT EXISTS idx_athletes_external_id ON athletes(external_id);
