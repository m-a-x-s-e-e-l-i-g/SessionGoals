<script lang="ts">
  import { page } from '$app/stores';
  import { CURRENT_USER_ID } from '$lib/data/session';
  import {
    getUserById,
    getTeacherForStudent,
    getStudentsForTeacher,
    getStudentTrackingSummary,
    isTeacher,
  } from '$lib/data/users';
  import { getGoals } from '$lib/data/goals';
  import { getLists } from '$lib/data/lists';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import ListCard from '$lib/components/ListCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  $: userId = $page.params.userId;
  $: profile = getUserById(userId);
  $: isOwnProfile = userId === CURRENT_USER_ID;
  $: profileTeacher = getTeacherForStudent(userId);
  $: teacherStudents = getStudentsForTeacher(userId);
  $: teacherViewEnabled = !!profile && isTeacher(profile) && (isOwnProfile || profile.isPublic);

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
          <span class="badge">Your Profile</span>
        {/if}
      </div>
      {#if profile.bio}
        <p class="profile-bio">{profile.bio}</p>
      {/if}
      <div class="profile-meta text-muted text-sm">
        {#if profile.city || profile.country}
          <span>{profile.city}{profile.city && profile.country ? ', ' : ''}{profile.country}</span>
        {/if}
        <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
      </div>
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
</style>
