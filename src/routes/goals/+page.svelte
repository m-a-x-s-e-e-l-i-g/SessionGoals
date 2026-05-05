<script lang="ts">
  import { getMyGoals } from '$lib/data/goals';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { GoalStatus } from '$lib/types';

  let goals = getMyGoals();

  let filterStatus: GoalStatus | 'all' = 'all';
  let searchQuery = '';

  const isCompleted = (status: GoalStatus): boolean => status === 'landed' || status === 'done';

  $: moveTotal = goals.filter((g) => g.type === 'move').length;
  $: spotTotal = goals.filter((g) => g.type === 'spot').length;
  $: inspirationTotal = goals.filter((g) => g.type === 'inspiration').length;

  $: moveDone = goals.filter((g) => g.type === 'move' && isCompleted(g.status)).length;
  $: spotDone = goals.filter((g) => g.type === 'spot' && isCompleted(g.status)).length;
  $: inspirationDone = goals.filter((g) => g.type === 'inspiration' && isCompleted(g.status)).length;
  $: totalDone = goals.filter((g) => isCompleted(g.status)).length;

  $: normalizedQuery = searchQuery.trim().toLowerCase();
  $: filteredByStatus = goals.filter((g) => {
    const matchesStatus = filterStatus === 'all' || g.status === filterStatus;
    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;

    const inTitle = g.title.toLowerCase().includes(normalizedQuery);
    const inDescription = (g.description ?? '').toLowerCase().includes(normalizedQuery);
    const inTags = g.tags.some((tag) => tag.name.toLowerCase().includes(normalizedQuery));
    return inTitle || inDescription || inTags;
  });
  $: moveGoals = filteredByStatus.filter((g) => g.type === 'move');
  $: spotGoals = filteredByStatus.filter((g) => g.type === 'spot');
  $: inspirationGoals = filteredByStatus.filter((g) => g.type === 'inspiration');
</script>

<svelte:head>
  <title>Goals — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Goals</h1>
    <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
  </div>

  <section class="stats-grid" aria-label="Goals progress summary">
    <article class="stat-card card">
      <p class="stat-label">Moves</p>
      <p class="stat-value">{moveDone}<span class="stat-divider">/</span>{moveTotal}</p>
    </article>
    <article class="stat-card card">
      <p class="stat-label">Spots</p>
      <p class="stat-value">{spotDone}<span class="stat-divider">/</span>{spotTotal}</p>
    </article>
    <article class="stat-card card">
      <p class="stat-label">Inspiration</p>
      <p class="stat-value">{inspirationDone}<span class="stat-divider">/</span>{inspirationTotal}</p>
    </article>
    <article class="stat-card card stat-card--total">
      <p class="stat-label">Overall</p>
      <p class="stat-value">{totalDone}<span class="stat-divider">/</span>{goals.length}</p>
    </article>
  </section>

  <div class="filters">
    <div class="search-shell">
      <span class="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
        </svg>
      </span>
      <input
        type="search"
        bind:value={searchQuery}
        class="search-input"
        placeholder="Search goals by title, notes, or tags"
        aria-label="Search goals"
      />
      {#if searchQuery}
        <button type="button" class="clear-search" on:click={() => (searchQuery = '')}>Clear</button>
      {/if}
    </div>
    <div class="form-group" style="margin:0">
      <select bind:value={filterStatus}>
        <option value="all">All statuses</option>
        <option value="idea">Idea</option>
        <option value="want_to_try">Want to try</option>
        <option value="training">Training</option>
        <option value="landed">Landed</option>
        <option value="done">Done</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  </div>

  {#if filteredByStatus.length === 0}
    <EmptyState
      icon="🎯"
      title="No goals found"
      message="Create your first goal or adjust your filters."
      actionHref="/goals/new"
    />
  {:else}
    <section class="goal-section">
      <h2 class="section-title">🤸 Move</h2>
      {#if moveGoals.length === 0}
        <p class="text-muted text-sm">No move goals for this status.</p>
      {:else}
        <div class="grid-cards">
          {#each moveGoals as goal}
            <GoalCard {goal} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="goal-section">
      <h2 class="section-title">📍 Spot</h2>
      {#if spotGoals.length === 0}
        <p class="text-muted text-sm">No spot goals for this status.</p>
      {:else}
        <div class="grid-cards">
          {#each spotGoals as goal}
            <GoalCard {goal} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="goal-section">
      <h2 class="section-title">💡 Inspiration</h2>
      {#if inspirationGoals.length === 0}
        <p class="text-muted text-sm">No inspiration goals for this status.</p>
      {:else}
        <div class="grid-cards">
          {#each inspirationGoals as goal}
            <GoalCard {goal} />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    padding: 0.85rem 1rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in oklch, var(--color-primary) 5%, white),
        var(--color-surface)
      );
  }

  .stat-card--total {
    border-color: color-mix(in oklch, var(--color-primary) 42%, var(--color-border));
  }

  .stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin-bottom: 0.2rem;
    font-weight: 700;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: clamp(1.45rem, 2.4vw, 1.9rem);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1;
  }

  .stat-divider {
    color: var(--color-text-muted);
    opacity: 0.8;
    margin: 0 0.2rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .search-shell {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    min-width: min(100%, 420px);
    flex: 1;
  }

  .search-shell:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 14%, transparent);
  }

  .search-icon {
    color: var(--color-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.15rem;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.92rem;
    padding: 0.4rem 0.2rem;
  }

  .search-input:focus {
    outline: none;
  }

  .clear-search {
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.18rem 0.55rem;
    min-height: 30px;
    cursor: pointer;
  }

  .clear-search:hover {
    color: var(--color-text);
    border-color: var(--color-primary);
  }

  .filters .form-group {
    min-width: 160px;
  }

  .goal-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.8rem;
  }

  @media (max-width: 900px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
