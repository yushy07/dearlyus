create table if not exists public.birthday_gifts(
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  record_key text not null default 'current-gift',
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check(char_length(title)<=120),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check(status in('draft','ready','revealed','revoked')),
  target_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(couple_id,record_key)
);

alter table public.birthday_gifts enable row level security;
drop policy if exists "birthday gift author access" on public.birthday_gifts;
create policy "birthday gift author access" on public.birthday_gifts for all to authenticated
using(created_by=auth.uid() and public.is_couple_member(couple_id))
with check(created_by=auth.uid() and public.is_couple_member(couple_id));
drop policy if exists "birthday gift reveal access" on public.birthday_gifts;
create policy "birthday gift reveal access" on public.birthday_gifts for select to authenticated
using(public.is_couple_member(couple_id) and status in('ready','revealed') and (target_at is null or target_at<=now()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('birthday-assets','birthday-assets',false,12582912,array['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "birthday media author upload" on storage.objects;
create policy "birthday media author upload" on storage.objects for insert to authenticated with check(
  bucket_id='birthday-assets' and (storage.foldername(name))[2]=auth.uid()::text
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists "birthday media author read" on storage.objects;
create policy "birthday media author read" on storage.objects for select to authenticated using(
  bucket_id='birthday-assets' and (storage.foldername(name))[2]=auth.uid()::text
);
drop policy if exists "revealed birthday media read" on storage.objects;
create policy "revealed birthday media read" on storage.objects for select to authenticated using(
  bucket_id='birthday-assets' and exists(
    select 1 from public.birthday_gifts gift where public.is_couple_member(gift.couple_id)
      and gift.status in('ready','revealed') and (gift.target_at is null or gift.target_at<=now())
      and (gift.payload->>'photoPath'=name or gift.payload->>'audioPath'=name)
  )
);
drop policy if exists "birthday media author delete" on storage.objects;
create policy "birthday media author delete" on storage.objects for delete to authenticated using(
  bucket_id='birthday-assets' and (storage.foldername(name))[2]=auth.uid()::text
);

revoke all on public.birthday_gifts from anon;
grant select,insert,update,delete on public.birthday_gifts to authenticated;
