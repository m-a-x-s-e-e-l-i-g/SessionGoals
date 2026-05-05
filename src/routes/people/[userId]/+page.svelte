<script lang="ts">
  import { page } from '$app/stores';
  import { CURRENT_USER_ID } from '$lib/data/session';
  import {
    getUserById,
    getTeacherForStudent,
    getStudentsForTeacher,
    getStudentTrackingSummary,
    updateUserProfile,
    isTeacher,
  } from '$lib/data/users';
  import { getGoals } from '$lib/data/goals';
  import { getLists } from '$lib/data/lists';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import ListCard from '$lib/components/ListCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { UserProfile } from '$lib/types';

  $: userId = $page.params.userId;
  $: profile = getUserById(userId);
  $: isOwnProfile = userId === CURRENT_USER_ID;
  $: profileTeacher = getTeacherForStudent(userId);
  $: teacherStudents = getStudentsForTeacher(userId);
  $: teacherViewEnabled = !!profile && isTeacher(profile) && (isOwnProfile || profile.isPublic);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  let editing = false;
  let editDisplayName = '';
  let editBio = '';
  let editCity = '';
  let editCountry = '';
  let editIsPublic = true;
  let editRole: UserProfile['role'] = 'athlete';

  function startEdit() {
    if (!profile) return;
    editDisplayName = profile.displayName;
    editBio = profile.bio ?? '';
    editCity = profile.city ?? '';
    editCountry = profile.country ?? '';
    editIsPublic = profile.isPublic;
    editRole = profile.role;
    editing = true;
  }

  function cancelEdit() {
    editing = false;
  }

  function saveEdit() {
    updateUserProfile(userId, {
      displayName: editDisplayName.trim() || profile?.displayName,
      bio: editBio.trim() || undefined,
      city: editCity.trim() || undefined,
      country: editCountry.trim() || undefined,
      isPublic: editIsPublic,
      role: editRole,
    });
    // re-read updated profile
    profile = getUserById(userId);
    editing = false;
  }

  $: visibleGoals = getGoals().filter((g) => {
    if (g.userId !== userId) return false;
    return isOwnProfile || profile?.isPublic;
  });

  $: visibleInspiration = visibleGoals.filter((g) => g.type === 'inspiration');
  $: visibleTrainingGoals = visibleGoals.filter((g) => g.type !== 'inspiration');

  $: visibleLists = getLists().filter((l) => {
    if (l.userId !== userId) return false;
    return isOwnProfile || l.visibility === 'public';
  });
</script>

<svelte:head>
  <title>{profile?.displayName ?? 'Profile'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !profile}
    <div class="not-found">
      <h2>Profile not found</h2>
      <a href="/people" class="btn btn-ghost">← Back to People</a>
    </div>
  {:else if !profile.isPublic && !isOwnProfile}
    <div class="not-found">
      <h2>This profile is private</h2>
      <a href="/people" class="btn btn-ghost">← Back to People</a>
    </div>
  {:else}
    <div class="profile-hero card">
      <div class="profile-header">
        <div>
          <a href="/people" class="back-link text-muted text-sm">← People</a>
          <h1 class="page-title">{profile.displayName}</h1>
          <p class="text-muted text-sm">@{profile.username}</p>
          <p class="text-muted text-sm role-line">
            Role: {profile.role === 'athlete_teacher' ? 'Athlete + Teacher' : profile.role === 'teacher' ? 'Teacher' : 'Athlete'}
          </p>
          {#if profile.teacherId && profileTeacher}
            <p class="text-muted text-sm">Coach: <a href="/people/{profileTeacher.id}">{profileTeacher.displayName}</a></p>
          {/if}
        </div>
        {#if isOwnProfile}
          <div class="own-profile-actions">
            <span class="badge">Your Profile</span>
            {#if !editing}
              <button class="btn btn-ghost btn-sm" on:click={startEdit}>Edit Profile</button>
            {/if}
          </div>
        {/if}
      </div>

      {#if isOwnProfile && editing}
        <form class="edit-form" on:submit|preventDefault={saveEdit}>
          <div class="form-row">
            <label class="form-label" for="edit-displayname">Display name</label>
            <input
              id="edit-displayname"
              class="form-input"
              type="text"
              bind:value={editDisplayName}
              required
              maxlength="60"
            />
          </div>
          <div class="form-row">
            <label class="form-label" for="edit-bio">Bio</label>
            <textarea
              id="edit-bio"
              class="form-input form-textarea"
              bind:value={editBio}
              rows="3"
              maxlength="300"
            ></textarea>
          </div>
          <div class="form-row-group">
            <div class="form-row">
              <label class="form-label" for="edit-city">City</label>
              <input id="edit-city" class="form-input" type="text" bind:value={editCity} maxlength="60" />
            </div>
            <div class="form-row">
              <label class="form-label" for="edit-country">Country</label>
              <input id="edit-country" class="form-input" type="text" bind:value={editCountry} maxlength="60" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label" for="edit-role">Role</label>
            <select id="edit-role" class="form-input form-select" bind:value={editRole}>
              <option value="athlete">Athlete</option>
              <option value="teacher">Teacher</option>
              <option value="athlete_teacher">Athlete + Teacher</option>
            </select>
          </div>
          <div class="form-row form-row-check">
            <input id="edit-public" type="checkbox" bind:checked={editIsPublic} />
            <label for="edit-public" class="form-label-inline">Public profile</label>
          </div>
          <div class="edit-actions">
            <button type="submit" class="btn btn-primary btn-sm">Save</button>
            <button type="button" class="btn btn-ghost btn-sm" on:click={cancelEdit}>Cancel</button>
          </div>
        </form>
      {:else}
        {#if profile.bio}
          <p class="profile-bio">{profile.bio}</p>
        {/if}
        <div class="profile-meta text-muted text-sm">
          {#if profile.city || profile.country}
            <span>{profile.city}{profile.city && profile.country ? ', ' : ''}{profile.country}</span>
          {/if}
          <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
        </div>
      {/if}
    </div>

    {#if teacherViewEnabled}
      <section class="section-block">
        <div class="section-header">
          <h2 class="section-title">Students</h2>
        </div>
        {#if teacherStudents.length === 0}
          <p class="text-muted">No students assigned yet.</p>
        {:else}
          <div class="student-grid">
            {#each teacherStudents as student}
              {@const summary = getStudentTrackingSummary(student.id)}
              <article class="student-card card">
                <div class="student-head">
                  <h3 class="student-name"><a href="/people/{student.id}">{student.displayName}</a></h3>
                  <span class="text-muted text-sm">@{student.username}</span>
                </div>
                <div class="student-metrics">
                  <span class="badge">Goals {summary.goalsDone}/{summary.goalsTotal}</span>
                  <span class="badge">Tracked {summary.trackedDone}/{summary.trackedTotal}</span>
                </div>
                <div>
                  <p class="text-muted text-sm needs-label">Needs</p>
                  {#if summary.needs.length === 0}
                    <p class="text-muted text-sm">No coaching needs listed.</p>
                  {:else}
                    <ul class="needs-list text-sm">
                      {#each summary.needs as need}
                        <li>{need}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Goals</h2>
      </div>
      {#if visibleTrainingGoals.length === 0}
        <EmptyState
          icon="🎯"
          title="No goals yet"
          message="No visible goals on this profile right now."
        />
      {:else}
        <div class="grid-cards">
          {#each visibleTrainingGoals as goal}
            <GoalCard {goal} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Inspiration</h2>
      </div>
      {#if visibleInspiration.length === 0}
        <p class="text-muted">No inspiration items yet.</p>
      {:else}
        <div class="grid-cards">
          {#each visibleInspiration as goal}
            <GoalCard {goal} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Lists</h2>
      </div>
      {#if visibleLists.length === 0}
        <p class="text-muted">No visible lists yet.</p>
      {:else}
        <div class="grid-cards">
          {#each visibleLists as list}
            <ListCard {list} />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
  }

  .profile-hero {
    margin-bottom: 1.5rem;
  }

  .profile-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 0.2rem;
  }

  .profile-bio {
    line-height: 1.55;
    margin-bottom: 0.55rem;
  }

  .profile-meta {
    display: flex;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  .role-line {
    margin-top: 0.2rem;
  }

  .section-block {
    margin-bottom: 2rem;
  }

  .section-header {
    margin-bottom: 0.9rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .student-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0.8rem;
  }

  .student-card {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .student-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.45rem;
  }

  .student-name {
    font-size: 1rem;
    font-weight: 700;
  }

  .student-name a {
    color: inherit;
    text-decoration: none;
  }

  .student-name a:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .student-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .needs-label {
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .needs-list {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--color-text);
  }

  /* ── Edit profile ─────────────────────────────────────────────────────────── */
  .own-profile-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-top: 0.65rem;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-row-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .form-row-check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-label-inline {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .form-input {
    background: var(--color-surface, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--radius-sm, 6px);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.95rem;
    padding: 0.45rem 0.65rem;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 72px;
  }

  .form-select {
    cursor: pointer;
  }

  .edit-actions {
    display: flex;
    gap: 0.55rem;
    margin-top: 0.25rem;
  }

  .btn-sm {
    padding: 0.3rem 0.8rem;
    font-size: 0.85rem;
  }
</style>
