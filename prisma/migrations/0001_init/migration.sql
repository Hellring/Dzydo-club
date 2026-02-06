-- Initial migration for DzydoClub
-- Creates core public tables: clubs, users, refresh_tokens and Role enum

CREATE TYPE role AS ENUM ('SUPERADMIN','ADMIN','COACH','JUDGE','ATHLETE','PARENT');

CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password TEXT NOT NULL,
  role role NOT NULL DEFAULT 'PARENT',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
