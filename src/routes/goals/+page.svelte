<script lang="ts">
  import { getGoals } from '$lib/data/goals';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { GoalType, GoalStatus } from '$lib/types';

  let goals = getGoals();

  let filterType: GoalType | 'all' = 'all';
  let filterStatus: GoalStatus | 'all' = 'all';

  $: filtered = goals.filter(
    (g) =>
      (filterType === 'all' || g.type === filterType) &&
      (filterStatus === 'all' || g.status === filterStatus)
  );
</script>

<svelte:head>
  <title>Goals — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Goals</h1>
    <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
  </div>

  <div class="filters">
    <div class="form-group" style="margin:0">
      <select bind:value={filterType}>
        <option value="all">All types</option>
        <option value="move">🤸 Move</option>
        <option value="spot">📍 Spot</option>
        <option value="challenge">🏆 Challenge</option>
        <option value="inspiration">💡 Inspiration</option>
      </select>
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

  {#if filtered.length === 0}
    <EmptyState
      icon="🎯"
      title="No goals found"
      message="Create your first goal or adjust your filters."
      actionHref="/goals/new"
    />
  {:else}
    <div class="grid-cards">
      {#each filtered as goal}
        <GoalCard {goal} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .filters .form-group {
    min-width: 160px;
  }
</style>
