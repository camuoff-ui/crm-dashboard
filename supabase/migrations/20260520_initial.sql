create extension if not exists "uuid-ossp";

create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz default now() not null
);

create table deals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  title text not null,
  value numeric(12,2) default 0 not null,
  stage text not null check (stage in ('prospeccao','qualificacao','proposta','negociacao','fechado')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

alter table clients enable row level security;
alter table deals enable row level security;

create policy "authenticated_all" on clients
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on deals
  for all to authenticated using (true) with check (true);
