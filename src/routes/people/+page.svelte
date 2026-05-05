<script lang="ts">
  import { searchPeople, getTeacherForStudent, getStudentsForTeacher, getStudentTrackingSummary } from '$lib/data/users';
  import { CURRENT_USER_ID } from '$lib/data/session';
  import { getGoals } from '$lib/data/goals';
  import { getPublicLists } from '$lib/data/lists';

  let query = '';
  function clearQuery() {
    query = '';
  }

  $: users = searchPeople(query);
  const myStudents = getStudentsForTeacher(CURRENT_USER_ID);

  function profileStats(userId: string): { goals: number; inspiration: number; publicLists: number } {
    const goals = getGoals().filter((g) => g.userId === userId && g.type !== 'inspiration').length;
    const inspiration = getGoals().filter((g) => g.userId === userId && g.type === 'inspiration').length;
    const publicLists = getPublicLists().filter((l) => l.userId === userId).length;
    return { goals, inspiration, publicLists };
  }
</script>

<svelte:head>
  <title>People — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">People</h1>
  </div>

  <p class="text-muted intro">Search athletes, open profiles, and discover public goals, inspiration, and lists.</p>

  {#if myStudents.length > 0}
    <section class="students-focus" aria-label="Your students">
      <div class="students-focus-header">
        <h2 class="students-focus-title">Your Students</h2>
        <span class="badge">{myStudents.length}</span>
      </div>
      <div class="students-focus-grid">
        {#each myStudents as student}
          {@const summary = getStudentTrackingSummary(student.id)}
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
          </a>
        {/each}
      </div>
    </section>
  {/if}

    <div class="search-shell" role="search" aria-label="People search">
      <label for="people-search" class="search-label">Find People</label>
      <div class="search-field-wrap">
        <span class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
          </svg>
        </span>
        <input
          id="people-search"
          type="search"
          bind:value={query}
          placeholder="Name, username, city, country"
          autocomplete="off"
          class="people-search-input"
        />
        {#if query}
          <button class="clear-search" type="button" on:click={() => (query = '')} aria-label="Clear search">
            Clear
          </button>
        {/if}
      </div>
      <p class="search-help text-muted text-sm">Try "lena", "berlin", or "@milo".</p>
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
              <span class="badge">{stats.inspiration} inspo</span>
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
    background: color-mix(in oklch, var(--color-primary) 5%, white);
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

    .search-shell {
      max-width: 640px;
      margin-bottom: 1.35rem;
      padding: 0.9rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background:
        linear-gradient(
          180deg,
          color-mix(in oklch, var(--color-primary) 5%, white),
          var(--color-surface)
        );
    }

    .search-label {
      display: block;
      margin-bottom: 0.45rem;
      font-weight: 700;
      font-size: 0.82rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: color-mix(in oklch, var(--color-primary) 70%, black);
    }

    .search-field-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.45rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .search-field-wrap:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 14%, transparent);
    }

    .search-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      margin-left: 0.15rem;
      flex-shrink: 0;
    }

    .people-search-input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      padding: 0.45rem 0.2rem;
      font-size: 0.95rem;
      color: var(--color-text);
    }

    .people-search-input:focus {
      outline: none;
    }

    .clear-search {
      border: 1px solid var(--color-border);
      background: var(--color-surface-2);
      color: var(--color-text-muted);
      border-radius: 999px;
      padding: 0.2rem 0.55rem;
      min-height: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .clear-search:hover {
      color: var(--color-text);
      border-color: var(--color-primary);
    }

    .search-help {
      margin-top: 0.45rem;
      margin-bottom: 0;
      font-size: 0.78rem;
  }

  .search-label {
    display: inline-block;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    margin-bottom: 0.4rem;
  }

  .search-shell {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: linear-gradient(
      180deg,
      color-mix(in oklch, var(--color-surface) 82%, white),
      var(--color-surface)
    );
    padding: 0.45rem 0.55rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-shell:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 18%, transparent);
  }

  .search-icon {
    color: var(--color-text-muted);
    font-size: 1.05rem;
    width: 1.4rem;
    text-align: center;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.95rem;
    padding: 0.2rem 0;
    font-family: inherit;
  }

  .search-input::placeholder {
    color: color-mix(in oklch, var(--color-text-muted) 88%, white);
  }

  .search-clear {
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    min-height: 32px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .search-clear:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
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
    background: color-mix(in oklch, var(--color-primary) 14%, white);
    color: color-mix(in oklch, var(--color-primary) 70%, black);
    border: 1px solid color-mix(in oklch, var(--color-primary) 45%, var(--color-border));
  }

  .stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

    @media (max-width: 520px) {
      .search-shell {
        padding: 0.75rem;
      }

      .search-field-wrap {
        gap: 0.35rem;
        padding: 0.3rem 0.35rem;
      }
    }
</style>
