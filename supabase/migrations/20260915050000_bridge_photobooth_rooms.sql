begin;

alter table public.photobooth_rooms add column if not exists date_room_id uuid references public.rooms(id) on delete set null;
alter table public.photobooth_rooms add column if not exists couple_id uuid references public.couples(id) on delete cascade;
create unique index if not exists photobooth_one_open_per_date_room_idx
  on public.photobooth_rooms(date_room_id)
  where date_room_id is not null and closed_at is null;

create or replace function public.open_photobooth_for_date_room(target_date_room uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); date_room public.rooms; booth public.photobooth_rooms;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into date_room from public.rooms r where r.id=target_date_room for update;
  if date_room.id is null or not public.is_room_member(date_room.id) then raise exception 'ROOM_ACCESS_DENIED'; end if;
  if date_room.status in ('completed','expired','cancelled') then raise exception 'ROOM_CLOSED'; end if;
  select * into booth from public.photobooth_rooms p
    where p.date_room_id=date_room.id and p.closed_at is null and p.expires_at>now()
    for update;
  if booth.id is null then
    insert into public.photobooth_rooms(host_id,date_room_id,couple_id)
      values(actor,date_room.id,date_room.couple_id) returning * into booth;
  elsif booth.host_id<>actor and booth.guest_id is null then
    update public.photobooth_rooms set guest_id=actor where id=booth.id returning * into booth;
  elsif booth.host_id<>actor and booth.guest_id<>actor then
    raise exception 'ROOM_FULL';
  end if;
  return jsonb_build_object('id',booth.id,'code',booth.code,'hostId',booth.host_id,'expiresAt',booth.expires_at,'dateRoomId',booth.date_room_id);
end $$;
revoke all on function public.open_photobooth_for_date_room(uuid) from public,anon;
grant execute on function public.open_photobooth_for_date_room(uuid) to authenticated;

commit;
