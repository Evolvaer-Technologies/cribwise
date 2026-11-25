-- Apply to a dedicated Supabase project before enabling the group UI.
-- Group comparisons live separately from public comparisons.

create schema if not exists private;

create table public.cribwise_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.cribwise_group_members (
  group_id uuid not null references public.cribwise_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index cribwise_group_members_user_id_idx on public.cribwise_group_members(user_id);

create table public.cribwise_group_comparisons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.cribwise_groups(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 160),
  option_a jsonb not null check (jsonb_typeof(option_a) = 'object'),
  option_b jsonb not null check (jsonb_typeof(option_b) = 'object'),
  created_at timestamptz not null default now()
);

create index cribwise_group_comparisons_group_id_idx on public.cribwise_group_comparisons(group_id, created_at desc);

create table public.cribwise_group_invites (
  token uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.cribwise_groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

create function private.add_cribwise_group_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cribwise_group_members(group_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger cribwise_group_owner_membership
after insert on public.cribwise_groups
for each row execute function private.add_cribwise_group_owner();

create function private.cribwise_member_group_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select group_id from public.cribwise_group_members
  where user_id = (select auth.uid())
$$;

revoke all on function private.cribwise_member_group_ids() from public;
grant usage on schema private to authenticated;
grant execute on function private.cribwise_member_group_ids() to authenticated;

alter table public.cribwise_groups enable row level security;
alter table public.cribwise_group_members enable row level security;
alter table public.cribwise_group_comparisons enable row level security;
alter table public.cribwise_group_invites enable row level security;

revoke all on public.cribwise_groups from anon, authenticated;
revoke all on public.cribwise_group_members from anon, authenticated;
revoke all on public.cribwise_group_comparisons from anon, authenticated;
revoke all on public.cribwise_group_invites from anon, authenticated;

grant select, insert on public.cribwise_groups to authenticated;
grant select on public.cribwise_group_members to authenticated;
grant select, insert, update, delete on public.cribwise_group_comparisons to authenticated;

create policy "members see their groups"
on public.cribwise_groups for select to authenticated
using (id in (select private.cribwise_member_group_ids()));

create policy "users create their own groups"
on public.cribwise_groups for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "members see group membership"
on public.cribwise_group_members for select to authenticated
using (group_id in (select private.cribwise_member_group_ids()));

create policy "members see group comparisons"
on public.cribwise_group_comparisons for select to authenticated
using (group_id in (select private.cribwise_member_group_ids()));

create policy "members create group comparisons"
on public.cribwise_group_comparisons for insert to authenticated
with check (
  creator_id = (select auth.uid())
  and group_id in (select private.cribwise_member_group_ids())
);

create policy "creators edit group comparisons"
on public.cribwise_group_comparisons for update to authenticated
using (creator_id = (select auth.uid()) and group_id in (select private.cribwise_member_group_ids()))
with check (creator_id = (select auth.uid()) and group_id in (select private.cribwise_member_group_ids()));

create policy "creators remove group comparisons"
on public.cribwise_group_comparisons for delete to authenticated
using (creator_id = (select auth.uid()) and group_id in (select private.cribwise_member_group_ids()));

create function public.create_cribwise_group_invite(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token uuid;
begin
  if not exists (
    select 1 from public.cribwise_groups
    where id = p_group_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Only the group owner can invite members';
  end if;

  insert into public.cribwise_group_invites(group_id, created_by)
  values (p_group_id, (select auth.uid()))
  returning token into new_token;

  return new_token;
end;
$$;

create function public.accept_cribwise_group_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited_group uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before joining a group';
  end if;

  update public.cribwise_group_invites
  set accepted_at = now()
  where token = p_token and accepted_at is null and expires_at > now()
  returning group_id into invited_group;

  if invited_group is null then
    raise exception 'Invitation unavailable or expired';
  end if;

  insert into public.cribwise_group_members(group_id, user_id, role)
  values (invited_group, (select auth.uid()), 'member')
  on conflict (group_id, user_id) do nothing;

  return invited_group;
end;
$$;

create function public.remove_cribwise_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.cribwise_groups
    where id = p_group_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Only the group owner can remove members';
  end if;

  delete from public.cribwise_group_members
  where group_id = p_group_id and user_id = p_user_id and role = 'member';
end;
$$;

revoke all on function public.create_cribwise_group_invite(uuid) from public, anon;
revoke all on function public.accept_cribwise_group_invite(uuid) from public, anon;
revoke all on function public.remove_cribwise_group_member(uuid, uuid) from public, anon;
grant execute on function public.create_cribwise_group_invite(uuid) to authenticated;
grant execute on function public.accept_cribwise_group_invite(uuid) to authenticated;
grant execute on function public.remove_cribwise_group_member(uuid, uuid) to authenticated;
