begin;

alter table public.plans_and_milestones
  drop constraint if exists plans_and_milestones_record_kind_check;

alter table public.plans_and_milestones
  add constraint plans_and_milestones_record_kind_check check (
    record_kind in (
      'future_plan','reunion','bucket_date','date_plan','ritual','forecast',
      'lab_session','love_match','date_night_capsule','birthday_gift',
      'passport','cupidot_home','room_rules'
    )
  );

commit;
