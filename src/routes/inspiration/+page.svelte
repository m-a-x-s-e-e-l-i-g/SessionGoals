<script lang="ts">
  import { getGoals } from '$lib/data/goals';
  import { getUserById } from '$lib/data/users';
  import { getSpotById } from '$lib/data/spots';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  let query = '';

  $: libraryMoves = getGoals()
    .filter((goal) => goal.type === 'move')
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());

  $: normalizedQuery = query.trim().toLowerCase();
  $: filteredMoves = libraryMoves.filter((goal) => {
    if (!normalizedQuery) return true;

    const owner = goal.userId ? getUserById(goal.userId) : undefined;
    const title = goal.title.toLowerCase();
    const description = (goal.description ?? '').toLowerCase();
    const ownerName = (owner?.displayName ?? '').toLowerCase();
    const ownerHandle = (owner?.username ?? '').toLowerCase();
    const tags = goal.tags.some((tag) => tag.name.toLowerCase().includes(normalizedQuery));

    return (
      title.includes(normalizedQuery)
      || description.includes(normalizedQuery)
      || ownerName.includes(normalizedQuery)
      || ownerHandle.includes(normalizedQuery)
      || tags
    );
  });
</script>

<svelte:head>
  <title>Movement Library — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Movement Library</h1>
    <a href="/goals/new?type=move" class="btn btn-primary">+ Add Move</a>
  </div>

  <p class="intro text-muted">
    Shared movement library with all moves. Browse ideas, inspect details, and build your own progression.
  </p>

  <div class="search-shell" role="search" aria-label="Search movement library">
    <input
      type="search"
      bind:value={query}
      class="search-input"
      placeholder="Search moves, tags, or athlete name"
    />
    {#if query}
      <button type="button" class="btn btn-ghost search-clear" on:click={() => (query = '')}>Clear</button>
    {/if}
  </div>

  {#if libraryMoves.length === 0}
    <EmptyState
      icon="🤸"
      title="No moves yet"
      message="Moves from everyone will appear here in one shared library."
      actionHref="/goals/new?type=move"
      actionLabel="Add your first move"
    />
  {:else if filteredMoves.length === 0}
    <EmptyState
      icon="🔎"
      title="No moves match your search"
      message="Try a different move name, tag, or athlete."
    />
  {:else}
    <div class="grid-cards mt-2">
      {#each filteredMoves as goal}
        {@const owner = goal.userId ? getUserById(goal.userId) : undefined}
        <div class="library-card-wrap">
          <GoalCard
            {goal}
            spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
          />
          <p class="library-meta text-muted text-sm">
            Added by {owner?.displayName ?? owner?.username ?? 'Unknown athlete'}
          </p>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .intro {
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .search-shell {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    margin-bottom: 1.2rem;
    max-width: 760px;
  }

  .search-input {
    flex: 1;
  }

  .search-clear {
    min-height: 36px;
    font-size: 0.82rem;
    padding: 0.35rem 0.85rem;
  }

  .library-card-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .library-meta {
    padding-inline: 0.15rem;
  }
</style>
