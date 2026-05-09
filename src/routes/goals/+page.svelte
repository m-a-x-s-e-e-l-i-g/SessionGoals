<script lang="ts">
  import { getMyGoals, updateGoalStatus } from '$lib/data/goals';
  import { getSpotById } from '$lib/data/spots';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { formatGoalType, typeIcon } from '$lib/utils/format';
  import type { GoalStatus } from '$lib/types';

  let goals = getMyGoals();
  let searchQuery = '';
  let archiveOpen = false;

  $: moveTotal = goals.filter((g) => g.type === 'move').length;
  $: spotTotal = goals.filter((g) => g.type === 'spot').length;
  $: moveDone = goals.filter((g) => g.type === 'move' && g.status === 'done').length;
  $: spotDone = goals.filter((g) => g.type === 'spot' && g.status === 'done').length;
  $: totalDone = goals.filter((g) => g.status === 'done').length;
  $: openCount = goals.length - totalDone;

  $: normalizedQuery = searchQuery.trim().toLowerCase();

  function matchesSearch(g: { title: string; description?: string | null }) {
    if (!normalizedQuery) return true;
    return (
      g.title.toLowerCase().includes(normalizedQuery) ||
      (g.description ?? '').toLowerCase().includes(normalizedQuery)
    );
  }

  $: activeGoals = goals.filter((g) => g.status !== 'done' && matchesSearch(g));
  $: archivedGoals = goals.filter((g) => g.status === 'done' && matchesSearch(g));

  $: activeMoveGoals = activeGoals.filter((g) => g.type === 'move');
  $: activeSpotGoals = activeGoals.filter((g) => g.type === 'spot');

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
      <span class="pipeline-total text-muted text-sm">{totalDone}/{goals.length} checked · {moveDone}/{moveTotal} moves · {spotDone}/{spotTotal} spots</span>
    </div>
    <div class="pipeline-track" role="img" aria-label="Goal completion distribution">
      {#if goals.length > 0}
        <div class="pipeline-seg pipeline-seg--done" style="flex: {Math.max(totalDone, 0)}"></div>
        <div class="pipeline-seg pipeline-seg--want_to_try" style="flex: {Math.max(openCount, 0)}; min-width: {openCount > 0 ? '4px' : '0'}"></div>
      {:else}
        <div class="pipeline-seg pipeline-seg--want_to_try" style="flex: 1"></div>
      {/if}
    </div>
    <div class="pipeline-legend" aria-hidden="true">
      <span class="pipeline-legend-item">
        <span class="pipeline-legend-dot pipeline-seg--done"></span>
        Checked <strong>{totalDone}</strong>
      </span>
      <span class="pipeline-legend-item">
        <span class="pipeline-legend-dot pipeline-seg--want_to_try"></span>
        Open <strong>{openCount}</strong>
      </span>
    </div>
  </section>

  <div class="filters">
    <div class="goal-search">
      <SearchBar
        bind:value={searchQuery}
        placeholder="Search goals"
        ariaLabel="Search goals"
        metaText={`Showing ${activeGoals.length} active · ${archivedGoals.length} archived`}
      />
    </div>
  </div>

  {#if activeGoals.length === 0 && archivedGoals.length === 0}
    <EmptyState
      icon="🎯"
      title="No goals found"
      message="Create your first goal or adjust your search."
      actionHref="/goals/new"
    />
  {:else if activeGoals.length === 0 && !normalizedQuery}
    <EmptyState
      icon="🎯"
      title="No active goals"
      message="All goals are checked off. Create a new one or uncheck something below."
      actionHref="/goals/new"
    />
  {:else}
    {#if activeMoveGoals.length > 0}
      <section class="goal-section">
        <h2 class="section-title">🤸 Move</h2>
        <div class="grid-cards">
          {#each activeMoveGoals as goal}
            <GoalCard
              {goal}
              spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
              onToggle={handleToggleGoal}
            />
          {/each}
        </div>
      </section>
    {/if}

    {#if activeSpotGoals.length > 0}
      <section class="goal-section">
        <h2 class="section-title">📍 Spot</h2>
        <div class="grid-cards">
          {#each activeSpotGoals as goal}
            <GoalCard
              {goal}
              spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
              onToggle={handleToggleGoal}
            />
          {/each}
        </div>
      </section>
    {/if}
  {/if}

  {#if archivedGoals.length > 0}
    <section class="archive-section">
      <button
        type="button"
        class="archive-toggle"
        aria-expanded={archiveOpen}
        on:click={() => (archiveOpen = !archiveOpen)}
      >
        <span class="archive-toggle-label">Checked off</span>
        <span class="archive-badge">{archivedGoals.length}</span>
        <span class="archive-chevron" class:open={archiveOpen}>▾</span>
      </button>

      {#if archiveOpen}
        <ul class="archive-list">
          {#each archivedGoals as goal}
            <li class="archive-item">
              <a href="/goals/{goal.id}" class="archive-title">{goal.title}</a>
              <span class="archive-type text-muted">{typeIcon(goal.type)} {formatGoalType(goal.type)}</span>
              <button
                type="button"
                class="archive-uncheck btn btn-ghost btn-sm"
                on:click={() => handleToggleGoal(goal.id)}
                aria-label="Uncheck {goal.title}"
              >Uncheck</button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
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

  .goal-search {
    min-width: min(100%, 320px);
    flex: 1;
  }

  .goal-search :global(.search-shell) {
    margin-bottom: 0;
    max-width: none;
  }

  .goal-section {
    margin-bottom: 2.25rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.8rem;
  }

  /* ─── Archive ──────────────────────────────────────────────────────── */
  .archive-section {
    margin-top: 1rem;
    border-top: 1px solid var(--color-border);
    padding-top: 0.75rem;
  }

  .archive-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    width: 100%;
    text-align: left;
  }

  .archive-toggle:hover {
    color: var(--color-text);
  }

  .archive-toggle-label {
    font-family: var(--font-display);
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .archive-badge {
    background: var(--color-surface-2);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .archive-chevron {
    margin-left: auto;
    font-size: 1rem;
    transition: transform 0.15s;
    display: inline-block;
  }

  .archive-chevron.open {
    transform: rotate(180deg);
  }

  .archive-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .archive-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }

  .archive-item:last-child {
    border-bottom: none;
  }

  .archive-title {
    flex: 1;
    color: var(--color-text);
    text-decoration: none;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .archive-title:hover {
    text-decoration: underline;
  }

  .archive-type {
    font-size: 0.78rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .archive-uncheck {
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .pipeline-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
