begin;

create or replace function public.get_couple_invite_preview_v2(invite_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_invite public.couple_invites;
  creator_name text;
  space_name text;
  existing_couple_id uuid;
  member_count integer;
  invite_state text;
begin
  if current_user_id is null then
    raise exception '[AUTH_REQUIRED] Sign in to view this invitation' using errcode = '42501';
  end if;

  select * into selected_invite
  from public.couple_invites ci
  where ci.code = upper(btrim(coalesce(invite_code, '')))
  limit 1;

  if selected_invite.id is null then
    raise exception '[INVITE_UNAVAILABLE] This invitation does not exist' using errcode = '22023';
  end if;

  select p.display_name into creator_name
  from public.profiles p
  where p.id = selected_invite.created_by;

  select c.name into space_name
  from public.couples c
  where c.id = selected_invite.couple_id;

  select cm.couple_id into existing_couple_id
  from public.couple_members cm
  where cm.user_id = current_user_id
  limit 1;

  select count(*)::integer into member_count
  from public.couple_members cm
  where cm.couple_id = selected_invite.couple_id;

  invite_state := case
    when existing_couple_id = selected_invite.couple_id then 'accepted'
    when existing_couple_id is not null then 'already_connected'
    when selected_invite.created_by = current_user_id then 'self_invite'
    when member_count >= 2 then 'couple_full'
    when selected_invite.status = 'accepted' or selected_invite.accepted_at is not null then 'already_used'
    when selected_invite.status = 'revoked' or selected_invite.revoked_at is not null then 'revoked'
    when selected_invite.status = 'expired' or selected_invite.expires_at <= now() then 'expired'
    else 'pending'
  end;

  return jsonb_build_object(
    'code', selected_invite.code,
    'spaceName', coalesce(nullif(space_name, ''), 'Our Space'),
    'inviterName', coalesce(nullif(creator_name, ''), 'Your person'),
    'expiresAt', selected_invite.expires_at,
    'state', invite_state,
    'isSelfInvite', selected_invite.created_by = current_user_id
  );
end;
$$;

revoke all on function public.get_couple_invite_preview_v2(text) from public, anon;
grant execute on function public.get_couple_invite_preview_v2(text) to authenticated;

commit;
