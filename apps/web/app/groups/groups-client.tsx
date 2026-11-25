"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase-browser";

type Group = { id: string; name: string; owner_id: string };
type GroupMember = { user_id: string; role: "owner" | "member"; joined_at: string };
type GroupComparison = {
  id: string;
  title: string;
  option_a: { displayName: string; rent?: number };
  option_b: { displayName: string; rent?: number };
};

export function GroupsClient() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [comparisons, setComparisons] = useState<GroupComparison[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [title, setTitle] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [rentA, setRentA] = useState("");
  const [rentB, setRentB] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const acceptedInvite = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setGroups([]);
      setSelected(null);
      setComparisons([]);
      return;
    }
    supabase.from("cribwise_groups").select("id,name,owner_id").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setGroups(data ?? []);
      });
  }, [user]);

  useEffect(() => {
    if (!supabase || !selected) {
      setComparisons([]);
      setMembers([]);
      return;
    }
    supabase.from("cribwise_group_comparisons")
      .select("id,title,option_a,option_b")
      .eq("group_id", selected.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setComparisons((data ?? []) as GroupComparison[]);
      });
    supabase.from("cribwise_group_members")
      .select("user_id,role,joined_at")
      .eq("group_id", selected.id)
      .order("joined_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setMembers((data ?? []) as GroupMember[]);
      });
  }, [selected]);

  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;
    const token = new URLSearchParams(window.location.search).get("invite");
    if (!token || acceptedInvite.current === token) return;
    acceptedInvite.current = token;
    client.rpc("accept_cribwise_group_invite", { p_token: token }).then(({ data, error }) => {
      if (error) setMessage(error.message);
      else {
        setMessage("You joined the group.");
        window.history.replaceState({}, "", "/groups");
        client.from("cribwise_groups").select("id,name,owner_id").order("created_at", { ascending: false })
          .then(({ data: refreshed }) => setGroups(refreshed ?? []));
        if (data) setSelected(null);
      }
    });
  }, [user]);

  async function authenticate(mode: "signIn" | "signUp") {
    if (!supabase || busy) return;
    if (mode === "signUp" && password.length < 8) {
      setMessage("Use at least eight characters for a new password.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result = mode === "signUp"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(result.error?.message ?? (mode === "signUp" && !result.data.session
      ? "Check your email to confirm your account, then sign in."
      : "You are signed in."));
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || busy) return;
    setBusy(true);
    const { data, error } = await supabase.from("cribwise_groups")
      .insert({ name: groupName.trim(), owner_id: user.id })
      .select("id,name,owner_id").single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setGroups((current) => [data, ...current]);
    setSelected(data);
    setGroupName("");
    setMessage("Group created.");
  }

  async function createInvite() {
    if (!supabase || !selected || busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("create_cribwise_group_invite", { p_group_id: selected.id });
    setBusy(false);
    if (error) return setMessage(error.message);
    setInviteLink(`${window.location.origin}/groups?invite=${data}`);
    setMessage("Single-use invitation created. It expires in seven days.");
  }

  async function createComparison(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selected || !user || busy) return;
    setBusy(true);
    const { data, error } = await supabase.from("cribwise_group_comparisons")
      .insert({
        group_id: selected.id,
        creator_id: user.id,
        title: title.trim(),
        option_a: { displayName: optionA.trim(), ...(rentA ? { rent: Number(rentA) } : {}) },
        option_b: { displayName: optionB.trim(), ...(rentB ? { rent: Number(rentB) } : {}) },
      })
      .select("id,title,option_a,option_b").single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setComparisons((current) => [data as GroupComparison, ...current]);
    setTitle("");
    setOptionA("");
    setOptionB("");
    setRentA("");
    setRentB("");
    setMessage("Comparison added to this group.");
  }

  async function removeMember(member: GroupMember) {
    if (!supabase || !selected || member.role !== "member" || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("remove_cribwise_group_member", {
      p_group_id: selected.id,
      p_user_id: member.user_id,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
    setMessage("Member removed. Their access to this group's comparisons has ended.");
  }

  if (!supabase) {
    return (
      <section className="content groups-page">
        <h1>Private groups</h1>
        <p>Group accounts are being connected. This feature needs a Supabase project before members can use it.</p>
      </section>
    );
  }

  return (
    <section className="content groups-page">
      <p className="eyebrow">Private space</p>
      <h1>Groups</h1>
      <p>Create a group and share comparisons with invited members.</p>
      {message && <p className="group-message" role="status">{message}</p>}
      {!user ? (
        <form className="group-form" onSubmit={(event) => {
          event.preventDefault();
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          authenticate(submitter?.value === "signUp" ? "signUp" : "signIn");
        }}>
          <h2>Sign in or create an account</h2>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          <div className="group-actions">
            <button className="button" disabled={busy} type="submit" name="authMode" value="signIn">Sign in</button>
            <button disabled={busy} type="submit" name="authMode" value="signUp">Create account</button>
          </div>
        </form>
      ) : (
        <>
          <div className="group-account"><span>Signed in as {user.email}</span><button type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button></div>
          <form className="group-form" onSubmit={createGroup}>
            <h2>Create a group</h2>
            <label>Group name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} minLength={2} maxLength={80} required placeholder="e.g. Manchester house hunt" /></label>
            <button className="button" disabled={busy} type="submit">Create group</button>
          </form>
          <div className="group-grid">
            <section className="group-panel">
              <h2>Your groups</h2>
              {groups.length === 0 && <p>No groups yet.</p>}
              <ul className="group-list">
                {groups.map((group) => <li key={group.id}><button type="button" aria-current={selected?.id === group.id ? "true" : undefined} onClick={() => { setSelected(group); setInviteLink(""); }}>{group.name}</button></li>)}
              </ul>
            </section>
            {selected && (
              <section className="group-panel">
                <h2>{selected.name}</h2>
                <p>Only signed-in members of this group can read its comparisons.</p>
                {selected.owner_id === user.id && (
                  <div className="group-invite">
                    <button type="button" disabled={busy} onClick={createInvite}>Create invite link</button>
                    {inviteLink && <input aria-label="Invite link" readOnly value={inviteLink} onFocus={(event) => event.target.select()} />}
                  </div>
                )}
                <section className="group-members" aria-label="Group members">
                  <h3>Members ({members.length})</h3>
                  <ul>
                    {members.map((member) => (
                      <li key={member.user_id}>
                        <span>{member.user_id === user.id ? "You" : `Member ${member.user_id.slice(0, 8)}`} · {member.role}</span>
                        {selected.owner_id === user.id && member.role === "member" && (
                          <button type="button" disabled={busy} onClick={() => removeMember(member)}>Remove</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                <form className="group-form" onSubmit={createComparison}>
                  <h3>Add a comparison</h3>
                  <label>Question<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={160} required placeholder="Which place would you choose?" /></label>
                  <div className="group-option-fields">
                    <label>Option A<input value={optionA} onChange={(event) => setOptionA(event.target.value)} required maxLength={100} placeholder="First place" /></label>
                    <label>Weekly rent A (£)<input type="number" min="0" step="1" value={rentA} onChange={(event) => setRentA(event.target.value)} /></label>
                    <label>Option B<input value={optionB} onChange={(event) => setOptionB(event.target.value)} required maxLength={100} placeholder="Second place" /></label>
                    <label>Weekly rent B (£)<input type="number" min="0" step="1" value={rentB} onChange={(event) => setRentB(event.target.value)} /></label>
                  </div>
                  <button className="button" disabled={busy} type="submit">Add comparison</button>
                </form>
                <h3>Group comparisons</h3>
                {comparisons.length === 0 && <p>No comparisons in this group yet.</p>}
                <ul className="group-comparisons">
                  {comparisons.map((comparison) => (
                    <li key={comparison.id}>
                      <strong>{comparison.title}</strong>
                      <span>Option A · {comparison.option_a.displayName}{comparison.option_a.rent !== undefined ? ` · £${comparison.option_a.rent}/week` : ""}</span>
                      <span>Option B · {comparison.option_b.displayName}{comparison.option_b.rent !== undefined ? ` · £${comparison.option_b.rent}/week` : ""}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </section>
  );
}
