<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getGoalById, updateGoalStatus, deleteGoal } from '$lib/data/goals';
  import { getSpotById } from '$lib/data/spots';
  import { formatStatus, formatGoalType, statusColor, typeIcon } from '$lib/utils/format';
  import TagBadge from '$lib/components/TagBadge.svelte';
  import type { GoalStatus } from '$lib/types';

  $: goalId = $page.params.goalId;
  $: goal = getGoalById(goalId);
  $: spot = goal?.spotId ? getSpotById(goal.spotId) : undefined;

  function handleStatusChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    updateGoalStatus(goalId, select.value as GoalStatus);
    // re-read to trigger reactivity
    goal = getGoalById(goalId);
  }

  function handleDelete() {
    if (confirm('Delete this goal?')) {
      deleteGoal(goalId);
      goto('/goals');
    }
  }
</script>

<svelte:head>
  <title>{goal?.title ?? 'Goal'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !goal}
    <div class="not-found">
      <h2>Goal not found</h2>
      <a href="/goals" class="btn btn-ghost">← Back to Goals</a>
    </div>
  {:else}
    <div class="page-header">
      <div>
        <a href="/goals" class="back-link text-muted text-sm">← Goals</a>
        <h1 class="page-title">{goal.title}</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
      </div>
    </div>

    <div class="detail-layout">
      <div class="detail-main">
        <div class="meta-row">
          <span class="badge type-{goal.type}">
            {typeIcon(goal.type)} {formatGoalType(goal.type)}
          </span>
          <select class="status-select" on:change={handleStatusChange} value={goal.status}>
            <option value="idea">Idea</option>
            <option value="want_to_try">Want to try</option>
            <option value="training">Training</option>
            <option value="landed">Landed ✓</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {#if goal.description}
          <p class="goal-description">{goal.description}</p>
        {/if}

        {#if goal.tags.length > 0}
          <div class="section">
            <h3 class="section-label">Tags</h3>
            <div class="flex flex-wrap gap-1">
              {#each goal.tags as tag}
                <TagBadge {tag} />
              {/each}
            </div>
          </div>
        {/if}

        {#if goal.links.length > 0}
          <div class="section">
            <h3 class="section-label">Links</h3>
            <ul class="links-list">
              {#each goal.links as link}
                <li>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-item">
                    {link.title ?? link.url}
                    <span class="text-muted text-sm">↗</span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if goal.sourceUrl}
          <div class="section">
            <h3 class="section-label">Source</h3>
            <a href={goal.sourceUrl} target="_blank" rel="noopener noreferrer">{goal.sourceUrl}</a>
          </div>
        {/if}
      </div>

      <div class="detail-sidebar">
        {#if goal.difficulty}
          <div class="sidebar-item">
            <span class="sidebar-label">Difficulty</span>
            <div class="difficulty-dots">
              {#each Array(5) as _, i}
                <span class="dot" class:filled={i < (goal.difficulty ?? 0)}>●</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if spot}
          <div class="sidebar-item">
            <span class="sidebar-label">Spot</span>
            <div class="spot-ref">
              <span>📍</span>
              <span>{spot.name}</span>
            </div>
            {#if spot.city}
              <span class="text-muted text-sm">{spot.city}, {spot.country}</span>
            {/if}
          </div>
        {/if}

        <div class="sidebar-item">
          <span class="sidebar-label">Created</span>
          <span class="text-sm text-muted">{new Date(goal.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
    text-align: center;
  }

  .back-link {
    display: block;
    margin-bottom: 0.25rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .detail-layout {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 2rem;
    align-items: start;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .status-select {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.3rem 0.65rem;
    cursor: pointer;
    width: auto;
  }

  .goal-description {
    color: var(--color-text-muted);
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .section {
    margin-top: 1.5rem;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .links-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.25rem;
  }

  .sidebar-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .sidebar-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .difficulty-dots {
    display: flex;
    gap: 3px;
    font-size: 0.75rem;
  }

  .dot { color: var(--color-border); }
  .dot.filled { color: var(--color-primary); }

  .spot-ref {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .detail-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
