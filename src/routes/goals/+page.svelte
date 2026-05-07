<script lang="ts">
  import { getMyGoals, updateGoalStatus } from '$lib/data/goals';
  import { getSpotById } from '$lib/data/spots';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { GoalStatus } from '$lib/types';

  let goals = getMyGoals();

  let filterStatus: GoalStatus | 'all' = 'all';
  let searchQuery = '';
  let filterTagId: string | null = null;

  const FILTERS: { status: GoalStatus; label: string }[] = [
    { status: 'want_to_try', label: 'Open' },
    { status: 'done', label: 'Checked' },
  ];

  $: statusCounts = FILTERS.map((entry) => ({
    ...entry,
    count: goals.filter((goal) => goal.status === entry.status).length,
  }));

  $: moveTotal = goals.filter((g) => g.type === 'move').length;
  $: spotTotal = goals.filter((g) => g.type === 'spot').length;
  $: inspirationTotal = goals.filter((g) => g.type === 'inspiration').length;

  $: moveDone = goals.filter((g) => g.type === 'move' && g.status === 'done').length;
  $: spotDone = goals.filter((g) => g.type === 'spot' && g.status === 'done').length;
  $: inspirationDone = goals.filter((g) => g.type === 'inspiration' && g.status === 'done').length;
  $: totalDone = goals.filter((g) => g.status === 'done').length;

  $: normalizedQuery = searchQuery.trim().toLowerCase();
  $: allTags = [...new Map(goals.flatMap((g) => g.tags).map((t) => [t.id, t])).values()];
  $: filteredByStatus = goals.filter((g) => {
    const matchStatus = filterStatus === 'all' || g.status === filterStatus;
    const matchTag = !filterTagId || g.tags.some((t) => t.id === filterTagId);
    if (!matchStatus || !matchTag) return false;
    if (!normalizedQuery) return true;

    const inTitle = g.title.toLowerCase().includes(normalizedQuery);
    const inDescription = (g.description ?? '').toLowerCase().includes(normalizedQuery);
    const inTags = g.tags.some((tag) => tag.name.toLowerCase().includes(normalizedQuery));
    return inTitle || inDescription || inTags;
  });
  $: moveGoals = filteredByStatus.filter((g) => g.type === 'move');
  $: spotGoals = filteredByStatus.filter((g) => g.type === 'spot');
  $: inspirationGoals = filteredByStatus.filter((g) => g.type === 'inspiration');

  async function handleToggleGoal(goalId: string) {
    const goal = goals.find((entry) => entry.id === goalId);
    if (!goal) return;
    const next: GoalStatus = goal.status === 'done' ? 'want_to_try' : 'done';
    await updateGoalStatus(goalId, next);
    goals = getMyGoals();
  }
</script>

<svelte:head>
  <title>Goals — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Goals</h1>
    <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
  </div>

  <section class="pipeline" aria-label="Goals progress summary">
    <div class="pipeline-header">
      <span class="pipeline-label">Progress</span>
      <span class="pipeline-total text-muted text-sm">{totalDone}/{goals.length} checked · {moveDone}/{moveTotal} moves · {spotDone}/{spotTotal} spots · {inspirationDone}/{inspirationTotal} inspiration</span>
    </div>
    <div class="pipeline-track" role="img" aria-label="Goal completion distribution">
      {#if goals.length > 0}
        <div class="pipeline-seg pipeline-seg--done" style="flex: {Math.max(totalDone, 0)}"></div>
        <div class="pipeline-seg pipeline-seg--want_to_try" style="flex: {Math.max(goals.length - totalDone, 0)}; min-width: {goals.length - totalDone > 0 ? '4px' : '0'}"></div>
      {:else}
        <div class="pipeline-seg pipeline-seg--want_to_try" style="flex: 1"></div>
      {/if}
    </div>
    <div class="pipeline-legend" aria-hidden="true">
      {#each statusCounts as entry}
        <span class="pipeline-legend-item">
          <span class="pipeline-legend-dot pipeline-seg--{entry.status}"></span>
          {entry.label} <strong>{entry.count}</strong>
        </span>
      {/each}
    </div>
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
        placeholder="Search goals…"
        aria-label="Search goals"
      />
      {#if searchQuery}
        <button type="button" class="clear-search" on:click={() => (searchQuery = '')}>Clear</button>
      {/if}
    </div>
    <div class="filter-chips" role="group" aria-label="Filter by goal completion">
      <button
        type="button"
        class="filter-chip"
        class:active={filterStatus === 'all'}
        on:click={() => (filterStatus = 'all')}
      >All <span class="chip-count">{goals.length}</span></button>
      {#each statusCounts as stage}
        <button
          type="button"
          class="filter-chip filter-chip--{stage.status}"
          class:active={filterStatus === stage.status}
          on:click={() => (filterStatus = stage.status)}
        >{stage.label} <span class="chip-count">{stage.count}</span></button>
      {/each}
    </div>
    {#if allTags.length > 0}
      <div class="tag-filter-chips" role="group" aria-label="Filter by tag">
        <button
          type="button"
          class="filter-chip"
          class:active={!filterTagId}
          on:click={() => (filterTagId = null)}
        >
          All tags
        </button>
        {#each allTags as tag}
          <button
            type="button"
            class="filter-chip"
            class:active={filterTagId === tag.id}
            on:click={() => (filterTagId = tag.id)}
          >
            #{tag.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if filteredByStatus.length === 0}
    <EmptyState
      icon="🎯"
      title="No goals found"
      message="Create your first goal or adjust your filters."
      actionHref="/goals/new"
    />
  {:else}
    {#if moveGoals.length > 0}
      <section class="goal-section">
        <h2 class="section-title">🤸 Move</h2>
        <div class="grid-cards">
          {#each moveGoals as goal}
            <div class="goal-card-wrap" class:is-done={goal.status === 'done'}>
              <GoalCard
                {goal}
                spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
                onToggle={handleToggleGoal}
              />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if spotGoals.length > 0}
      <section class="goal-section">
        <h2 class="section-title">📍 Spot</h2>
        <div class="grid-cards">
          {#each spotGoals as goal}
            <div class="goal-card-wrap" class:is-done={goal.status === 'done'}>
              <GoalCard
                {goal}
                spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
                onToggle={handleToggleGoal}
              />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if inspirationGoals.length > 0}
      <section class="goal-section">
        <h2 class="section-title">💡 Inspiration</h2>
        <div class="grid-cards">
          {#each inspirationGoals as goal}
            <div class="goal-card-wrap" class:is-done={goal.status === 'done'}>
              <GoalCard
                {goal}
                spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
                onToggle={handleToggleGoal}
              />
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .pipeline {
    margin-bottom: 1.5rem;
  }

  .pipeline-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .pipeline-label {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--color-text-muted);
  }

  .pipeline-track {
    display: flex;
    height: 14px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    gap: 2px;
  }

  .pipeline-seg {
    min-width: 6px;
    border-radius: 2px;
    transition: opacity 0.15s;
  }

  .pipeline-seg:hover {
    opacity: 0.8;
  }

  .pipeline-seg--want_to_try { background: var(--badge-want-text); opacity: 0.5; }
  .pipeline-seg--done        { background: var(--color-primary); }

  .pipeline-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    margin-top: 0.5rem;
  }

  .pipeline-legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  .pipeline-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    display: inline-block;
    flex-shrink: 0;
  }

  .pipeline-legend-item strong {
    color: var(--color-text);
    font-weight: 700;
  }

  /* ─── Filters ──────────────────────────────────────────────────────── */
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .search-shell {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    min-width: min(100%, 320px);
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
    min-height: 44px;
    cursor: pointer;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .filter-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    min-height: 44px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    white-space: nowrap;
  }

  .filter-chip:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }

  .filter-chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
  }

  .filter-chip--want_to_try.active{ background: var(--badge-want-bg);     border-color: var(--badge-want-text);     color: var(--badge-want-text); }
  .filter-chip--done.active       { background: var(--badge-done-bg);     border-color: var(--badge-done-text);     color: var(--badge-done-text); }

  .chip-count {
    font-weight: 700;
    opacity: 0.75;
  }

  .filter-chip.active .chip-count {
    opacity: 1;
  }

  /* ─── Goal sections ────────────────────────────────────────────────── */
  .goal-section {
    margin-bottom: 2.25rem;
  }

  .clear-search:hover {
    color: var(--color-text);
    border-color: var(--color-primary);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.8rem;
  }

  .goal-card-wrap {
    transition: border-color 0.18s ease;
  }

  .goal-card-wrap.is-done :global(.goal-card) {
    border-color: var(--color-success);
  }

  .tag-filter-chips {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    width: 100%;
  }

  .tag-filter-chips::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 640px) {
    .pipeline-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-chips {
      width: 100%;
    }

    .filter-chip {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
