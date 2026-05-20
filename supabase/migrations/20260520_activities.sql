create table activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  type text not null check (type in ('ligar', 'agendar', 'whatsapp', 'ligar_mais_tarde')),
  notes text,
  due_date date not null default current_date,
  due_time time,
  status text not null default 'pending' check (status in ('pending', 'done')),
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

alter table activities enable row level security;

create policy "authenticated full access on activities"
  on activities for all
  to authenticated
  using (true)
  with check (true);

create index activities_due_date_idx on activities(due_date);
create index activities_client_id_idx on activities(client_id);
