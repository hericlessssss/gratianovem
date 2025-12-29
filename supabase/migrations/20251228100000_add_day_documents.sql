create table public.day_documents (
    id uuid primary key default gen_random_uuid(),
    novena_day_id uuid not null references public.novena_days(id) on delete cascade,
    locale text not null check (locale in ('pt', 'en')),
    doc jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    unique(novena_day_id, locale)
);

-- Enable RLS
alter table public.day_documents enable row level security;

-- Policies for day_documents
create policy "Anyone can view day documents" on public.day_documents
    for select using (
        exists (
            select 1 from public.novena_days nd
            join public.novenas n on n.id = nd.novena_id
            where nd.id = novena_day_id and n.is_active = true
        )
    );

create policy "Admins can manage day documents" on public.day_documents
    for all using (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
create trigger update_day_documents_updated_at
    before update on public.day_documents
    for each row execute function public.update_updated_at_column();
