<script lang="ts">
  import type { Goal } from '$lib/types';
  import { formatStatus, formatGoalType, statusColor, typeIcon } from '$lib/utils/format';
  import TagBadge from './TagBadge.svelte';

  export let goal: Goal;
  export let onToggle: ((id: string) => void) | undefined = undefined;
  export let spotName: string | undefined = undefined;
</script>

<div class="goal-card card">
  <div class="goal-card-header">
    <span class="type-badge badge type-{goal.type}">
      {typeIcon(goal.type)} {formatGoalType(goal.type)}
    </span>
    <div class="goal-card-header-actions">
      {#if goal.status === 'done'}
        <span class="badge {statusColor(goal.status)}">✓ {formatStatus(goal.status)}</span>
      {/if}
      {#if onToggle}
        <button
          type="button"
          class="quick-check"
          class:is-done={goal.status === 'done'}
          on:click={() => onToggle?.(goal.id)}
          aria-label={goal.status === 'done' ? 'Mark goal as unchecked' : 'Mark goal as checked'}
          aria-pressed={goal.status === 'done'}
        >
          ✓
        </button>
      {/if}
    </div>
  </div>

  <a href="/goals/{goal.id}" class="goal-card-link">
    <h3 class="goal-title">{goal.title}</h3>

    {#if goal.description}
      <p class="goal-desc text-muted text-sm">{goal.description}</p>
    {/if}

    {#if goal.tags.length > 0}
      <div class="goal-tags flex flex-wrap gap-1 mt-1">
        {#each goal.tags.slice(0, 4) as tag}
          <TagBadge {tag} />
        {/each}
        {#if goal.tags.length > 4}
          <span class="text-muted text-sm">+{goal.tags.length - 4}</span>
        {/if}
      </div>
    {/if}

    {#if spotName}
      <p class="goal-spot text-sm text-muted">📍 {spotName}</p>
    {/if}

    {#if goal.difficulty}
      <div class="goal-difficulty mt-1" title="Difficulty: {goal.difficulty} out of 5" aria-label="Difficulty {goal.difficulty} out of 5">
        {#each Array(5) as _, i}
          <span class="dot" class:filled={i < (goal.difficulty ?? 0)}>●</span>
        {/each}
      </div>
    {/if}
  </a>
</div>

<style>
  .goal-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    color: var(--color-text);
    transition: border-color 0.18s, transform 0.18s;
  }

  .goal-card:hover,
  .goal-card:focus-within {
    border-color: var(--color-primary);
    transform: translateY(-3px);
  }

  .goal-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .goal-card-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .goal-card-link {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    color: inherit;
    text-decoration: none;
  }

  .goal-card-link:hover {
    text-decoration: none;
  }

  .goal-title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .goal-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goal-difficulty {
    display: flex;
    gap: 3px;
    font-size: 0.8rem;
  }

  .quick-check {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 1rem;
    font-weight: 700;
    padding: 0;
  }

  .quick-check.is-done {
    background: color-mix(in oklch, var(--color-success) 18%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-success) 42%, var(--color-border));
    color: var(--color-success);
  }

  .dot { color: var(--color-border); }
  .dot.filled { color: var(--color-primary); }
</style>
