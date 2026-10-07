-- Creates the app's database user and database if they don't exist yet.
SELECT 'CREATE ROLE expense LOGIN PASSWORD ''expense'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'expense')\gexec

SELECT 'CREATE DATABASE expenses OWNER expense'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'expenses')\gexec
