<script lang="ts">
  import { page } from '$app/stores';
  import { searchPeople, getTeacherForStudent, getStudentsForTeacher, getStudentTrackingSummary } from '$lib/data/users';
  import { getGoals } from '$lib/data/goals';
  import { getPublicLists } from '$lib/data/lists';
  import { getActivityStats } from '$lib/data/activities';
  import SearchBar from '$lib/components/SearchBar.svelte';

  let query = '';

  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id;
  $: users = searchPeople(query);
  $: myStudents = currentUserId ? getStudentsForTeacher(currentUserId) : [];

  function profileStats(userId: string): { goals: number; publicLists: number } {
    const goals = getGoals().filter((g) => g.userId === userId && !g.isListOnly).length;
    const publicLists = getPublicLists().filter((l) => l.userId === userId).length;
    return { goals, publicLists };
  }
</script>

<svelte:head>
  <title>People — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">People</h1>
  </div>

  <p class="text-muted intro">Search athletes, open profiles, and discover public goals and lists.</p>

  {#if isAuthenticated && myStudents.length > 0}
    <section class="students-focus" aria-label="Your students">
      <div class="students-focus-header">
        <h2 class="students-focus-title">Your Students</h2>
        <span class="badge">{myStudents.length}</span>
      </div>
      <div class="students-focus-grid">
        {#each myStudents as student}
          {@const summary = getStudentTrackingSummary(student.id)}
          {@const activityStats = getActivityStats(7, student.id)}
          <a href="/people/{student.id}" class="student-pill card">
            <div class="student-pill-head">
              <strong>{student.displayName}</strong>
              <span class="text-muted text-sm">@{student.username}</span>
            </div>
            <div class="student-pill-meta">
              <span class="badge">Goals {summary.goalsDone}/{summary.goalsTotal}</span>
              <span class="badge">Tracked {summary.trackedDone}/{summary.trackedTotal}</span>
              <span class="badge">Needs {summary.needs.length}</span>
            </div>
            {#if activityStats.streak > 0 || activityStats.activeDays > 0}
              <div class="student-activity">
                <span class="activity-stat">
                  <span class="activity-icon">🔥</span>
                  <span class="activity-value">{activityStats.streak}</span>
                </span>
                <span class="activity-stat">
                  <span class="activity-icon">📅</span>
                  <span class="activity-value">{activityStats.activeDays}</span>
                </span>
              </div>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <div class="people-search-wrap">
    <SearchBar
      id="people-search"
      bind:value={query}
      label="Find People"
      placeholder="Name, username, city, country"
      ariaLabel="People search"
      helperText={'Try "lena", "berlin", or "@milo".'}
      metaText={`Showing ${users.length} ${users.length === 1 ? 'athlete' : 'athletes'}`}
    />
  </div>

  {#if users.length === 0}
    <p class="text-muted">No people found for "{query}".</p>
  {:else}
    <div class="grid-cards">
      {#each users as user}
        {@const stats = profileStats(user.id)}
        <a href="/people/{user.id}" class="person-card card">
          <div class="person-head">
            <h2 class="person-name">{user.displayName}</h2>
            <span class="person-handle">@{user.username}</span>
          </div>
          <div class="role-row">
            <span class="badge role-badge">{user.role === 'athlete_teacher' ? 'Athlete + Teacher' : user.role === 'teacher' ? 'Teacher' : 'Athlete'}</span>
            {#if user.teacherId}
              {@const teacher = getTeacherForStudent(user.id)}
              {#if teacher}
                <span class="text-muted text-sm">Student of {teacher.displayName}</span>
              {/if}
            {/if}
          </div>
          {#if user.bio}
            <p class="text-muted text-sm">{user.bio}</p>
          {/if}
          <div class="person-meta">
            {#if user.city || user.country}
              <span class="text-muted text-sm">{user.city}{user.city && user.country ? ', ' : ''}{user.country}</span>
            {/if}
            <div class="stats-row">
              <span class="badge">{stats.goals} goals</span>
              <span class="badge">{stats.publicLists} lists</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .intro {
    margin-bottom: 1rem;
  }

  .students-focus {
    margin-bottom: 1.1rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid color-mix(in oklch, var(--color-primary) 35%, var(--color-border));
    border-radius: var(--radius-md);
    background: linear-gradient(
      180deg,
      color-mix(in oklch, var(--color-surface) 92%, var(--color-primary) 8%),
      var(--color-surface)
    );
  }

  .students-focus-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
    margin-bottom: 0.65rem;
  }

  .students-focus-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .students-focus-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.55rem;
  }

  .student-pill {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    text-decoration: none;
    color: var(--color-text);
    padding: 0.7rem 0.8rem;
  }

  .student-pill:hover {
    border-color: var(--color-primary);
    text-decoration: none;
  }

  .student-pill-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .student-pill-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .people-search-wrap {
    margin-bottom: 1.35rem;
  }

  .people-search-wrap :global(.search-shell) {
    max-width: 720px;
  }

  @media (prefers-color-scheme: dark) {
    .students-focus {
      border-color: color-mix(in oklch, var(--color-primary) 24%, var(--color-border));
      background:
        radial-gradient(circle at top right, color-mix(in oklch, var(--color-primary) 10%, transparent), transparent 52%),
        linear-gradient(
          180deg,
          color-mix(in oklch, var(--color-surface) 95%, var(--color-primary) 5%),
          var(--color-surface)
        );
    }

    .people-search-wrap :global(.search-shell) {
      border-color: color-mix(in oklch, var(--color-primary) 24%, var(--color-border));
    }
  }

  .person-card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    text-decoration: none;
    color: var(--color-text);
    transition: border-color 0.15s;
  }

  .person-card:hover {
    border-color: var(--color-primary);
    text-decoration: none;
  }

  .person-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .person-name {
    font-size: 1.05rem;
    font-weight: 700;
  }

  .person-handle {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .person-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .role-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .role-badge {
    background: color-mix(in oklch, var(--color-primary) 14%, var(--color-surface));
    color: color-mix(in oklch, var(--color-primary) 70%, var(--color-text));
    border: 1px solid color-mix(in oklch, var(--color-primary) 45%, var(--color-border));
  }

  .stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .student-activity {
    display: flex;
    gap: 0.6rem;
    padding-top: 0.35rem;
    border-top: 1px solid var(--color-border);
  }

  .activity-stat {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .activity-icon {
    font-size: 0.9rem;
  }

  .activity-value {
    font-weight: 600;
    color: var(--color-text);
  }

  @media (max-width: 520px) {
    .people-search-wrap :global(.search-shell) {
      max-width: 100%;
    }
  }
</style>
