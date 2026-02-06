-- Create invitations table in public schema
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  role role NOT NULL DEFAULT 'PARENT',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
