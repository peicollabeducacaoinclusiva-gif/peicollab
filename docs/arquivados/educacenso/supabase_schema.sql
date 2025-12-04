-- supabase_schema.sql
-- Sugestão de esquema inicial para Supabase (Postgres)

CREATE TABLE schools (
  id serial primary key,
  local_id text unique,
  inep_code text,
  name text not null,
  municipio_ibge text not null,
  dependencia integer,
  ano_base integer,
  created_at timestamptz default now()
);

CREATE TABLE classes (
  id serial primary key,
  school_id integer references schools(id),
  local_id text,
  description text,
  shift text,
  serie integer,
  capacity integer
);

CREATE TABLE people (
  id serial primary key,
  local_id text unique,
  name text not null,
  birthdate date,
  cpf text,
  sex text,
  inep_id text
);

CREATE TABLE staff (
  id serial primary key,
  person_id integer references people(id),
  role_code text,
  workload integer,
  admission_date date,
  inep_id text
);

CREATE TABLE managers (
  id serial primary key,
  person_id integer references people(id),
  school_id integer references schools(id),
  role text,
  start_date date
);

CREATE TABLE enrollments (
  id serial primary key,
  person_id integer references people(id),
  class_id integer references classes(id),
  enrollment_date date,
  situation text,
  inep_id text
);

CREATE TABLE migration_logs (
  id serial primary key,
  filename text,
  sha256 text,
  user_id integer,
  records_count integer,
  status text,
  result_file_path text,
  created_at timestamptz default now()
);
