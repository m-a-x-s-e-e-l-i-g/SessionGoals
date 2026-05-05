<script lang="ts">
  import { getSpots } from '$lib/data/spots';
  import SpotCard from '$lib/components/SpotCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const spots = getSpots();
  let query = '';

  $: filtered = spots.filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.city?.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.name.toLowerCase().includes(query.toLowerCase()))
  );
</script>

<svelte:head>
  <title>Spots — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Spots</h1>
  </div>

  <div class="spots-intro">
    <p class="text-muted">
      Browse training spots. In a future update, spots will be powered by the
      <strong>parkour.spot</strong> API — search real locations, filter by tags, and
      get suggested spots for your goals.
    </p>
  </div>

  <div class="search-bar">
    <input
      type="text"
      bind:value={query}
      placeholder="Search by name, city, or tag…"
      class="search-input"
    />
  </div>

  {#if filtered.length === 0}
    <EmptyState
      icon="🗺️"
      title="No spots found"
      message="Try a different search term."
    />
  {:else}
    <div class="grid-cards">
      {#each filtered as spot}
        <SpotCard {spot} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .spots-intro {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .search-bar {
    margin-bottom: 1.5rem;
  }

  .search-input {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.95rem;
    padding: 0.65rem 1rem;
    width: 100%;
    max-width: 400px;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
</style>
