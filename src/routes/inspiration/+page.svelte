<script lang="ts">
  import { getGoals } from '$lib/data/goals';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const inspirations = getGoals().filter((g) => g.type === 'inspiration');
</script>

<svelte:head>
  <title>Inspiration — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Inspiration</h1>
    <a href="/goals/new" class="btn btn-primary">+ Save Inspiration</a>
  </div>

  <p class="intro text-muted">
    Save tutorials, reels, and athlete clips. Tag them to discover related spots and moves.
  </p>

  {#if inspirations.length === 0}
    <EmptyState
      icon="💡"
      title="No inspiration saved yet"
      message="Paste a YouTube link, Instagram reel, or any URL you want to revisit."
      actionHref="/goals/new"
      actionLabel="Save Inspiration"
    />
  {:else}
    <div class="grid-cards mt-2">
      {#each inspirations as goal}
        <GoalCard {goal} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .intro {
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
</style>
