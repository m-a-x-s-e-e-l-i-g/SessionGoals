<script lang="ts">
  import { page } from '$app/stores';
  import type { Spot } from '$lib/types';
  import SpotCard from '$lib/components/SpotCard.svelte';
  import SpotActions from '$lib/components/SpotActions.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { getLists, getListById } from '$lib/data/lists';
  import { getGoals, getMyGoals } from '$lib/data/goals';
  import { getSpots } from '$lib/data/spots';
  import { getTrackedProgress } from '$lib/data/listProgress';
  import type { Goal } from '$lib/types';

  export let data: {
    spots: Spot[];
    error: 'missing_api_key' | 'api_error' | null;
    query: string;
  };

  $: isAuthenticated = !!$page.data.user;
  $: spots = data.spots;
  $: query = $page.url.searchParams.get('q') ?? '';
  const lists = getLists();
  const allGoals = getGoals();
  const allKnownSpots = getSpots();

  const goalById = new Map(allGoals.map((goal) => [goal.id, goal]));
  const myGoals = getMyGoals();
  const trackedProgress = getTrackedProgress();
  const trackedGoals: Goal[] = trackedProgress.flatMap((progress) => {
    const list = getListById(progress.sourceListId);
    if (!list) return [];
    return list.items
      .map((item) => goalById.get(item.goalId) ?? item.goal)
      .filter((goal): goal is Goal => !!goal);
  });

  const actionGoals = [...myGoals, ...trackedGoals].filter((goal) => !!goal.spotId);
  const actionSpotCounts = new Map<string, number>();
  for (const goal of actionGoals) {
    const spotId = goal.spotId;
    if (!spotId) continue;
    actionSpotCounts.set(spotId, (actionSpotCounts.get(spotId) ?? 0) + 1);
  }

  const spotById = new Map(allKnownSpots.map((spot) => [spot.id, spot]));
  const actionSpots = Array.from(actionSpotCounts.keys())
    .map((spotId) => spotById.get(spotId))
    .filter((spot): spot is Spot => !!spot);

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

  {#if isAuthenticated}
    <section class="my-spots-section">
      <div class="section-header">
        <h2 class="section-title">Your Action Spots</h2>
      </div>
      {#if actionSpots.length === 0}
        <p class="text-muted">No spot-linked goals yet. Add a goal to a spot and it will appear here.</p>
      {:else}
        <div class="grid-cards my-spots-grid">
          {#each actionSpots as spot}
            <div class="my-spot-wrap">
              <SpotCard {spot} showActions>
                <SpotActions slot="actions" {spot} {lists} goals={allGoals} />
              </SpotCard>
              <p class="text-muted text-sm my-spot-meta">
                {actionSpotCounts.get(spot.id)} goal{actionSpotCounts.get(spot.id) === 1 ? '' : 's'} tied to this spot
              </p>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <div class="section-divider" aria-hidden="true"></div>
  {/if}

  {#if data.error === 'missing_api_key'}
    <div class="spots-error">
      Spot search isn't set up yet — parkour.spot isn't connected.
    </div>
  {:else if data.error === 'api_error'}
    <div class="spots-error spots-error--retry">
      <span>Couldn't reach parkour.spot right now.</span>
      <a href="/spots" class="btn btn-ghost spots-retry-btn">Try again</a>
    </div>
  {/if}

  <form class="search-bar" method="GET">
    <input
      type="text"
      bind:value={query}
      name="q"
      placeholder="Search by name, city, or tag…"
      class="search-input"
    />
    <button class="btn btn-ghost search-btn" type="submit">
      <svg class="parkour-spot-logo" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
        <path d="M8 6h4.5a4.5 4.5 0 0 1 0 9H10v3H8V6zm2 2v5h2.5a2.5 2.5 0 0 0 0-5H10z" fill="var(--color-surface)"></path>
      </svg>
      <span>Search parkour.spot</span>
    </button>
    {#if query}
      <button type="button" class="btn btn-ghost search-btn" on:click={() => (query = '')}>
        Clear
      </button>
    {/if}
  </form>

  {#if !query && !data.error}
    <EmptyState
      icon="🔍"
      title="Search for spots"
      message="Type a name, city, or tag above and hit Search."
    />
  {:else if filtered.length === 0 && !data.error}
    <EmptyState
      icon="🗺️"
      title="No spots found"
      message="Try a different search term."
    />
  {:else}
    <div class="grid-cards">
      {#each filtered as spot}
        {#if isAuthenticated}
          <SpotCard {spot} showActions>
            <SpotActions slot="actions" {spot} {lists} goals={allGoals} />
          </SpotCard>
        {:else}
          <SpotCard {spot} />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .my-spots-section {
    margin-bottom: 1.5rem;
  }

  .section-header {
    margin-bottom: 0.8rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
  }

  .my-spots-grid {
    margin-bottom: 0.5rem;
  }

  .my-spot-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .my-spot-meta {
    padding-inline: 0.15rem;
  }

  .section-divider {
    border-top: 1px solid var(--color-border);
    margin: 0.5rem 0 1.5rem;
  }

  .spots-error {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    padding: 1rem 1.25rem;
  }

  .spots-error--retry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .spots-retry-btn {
    flex-shrink: 0;
    font-size: 0.85rem;
    padding: 0.4rem 0.9rem;
    min-height: 36px;
  }

  .search-bar {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
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

  .search-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    white-space: nowrap;
  }

  .parkour-spot-logo {
    flex-shrink: 0;
    color: var(--color-primary);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
</style>
