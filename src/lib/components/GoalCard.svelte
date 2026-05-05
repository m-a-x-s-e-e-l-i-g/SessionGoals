<script lang="ts">
  import type { Goal } from '$lib/types';
  import { formatStatus, formatGoalType, statusColor, typeIcon } from '$lib/utils/format';
  import TagBadge from './TagBadge.svelte';

  export let goal: Goal;
</script>

<a href="/goals/{goal.id}" class="goal-card card">
  <div class="goal-card-header">
    <span class="type-badge badge type-{goal.type}">
      {typeIcon(goal.type)} {formatGoalType(goal.type)}
    </span>
    <span class="badge {statusColor(goal.status)}">{formatStatus(goal.status)}</span>
  </div>

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

  {#if goal.difficulty}
    <div class="goal-difficulty mt-1">
      {#each Array(5) as _, i}
        <span class="dot" class:filled={i < (goal.difficulty ?? 0)}>●</span>
      {/each}
    </div>
  {/if}
</a>

<style>
  .goal-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    text-decoration: none;
    color: var(--color-text);
    transition: border-color 0.15s, transform 0.15s;
    cursor: pointer;
  }

  .goal-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .goal-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
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
    font-size: 0.65rem;
  }

  .dot { color: var(--color-border); }
  .dot.filled { color: var(--color-primary); }
</style>
