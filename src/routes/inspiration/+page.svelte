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
    <div class="search-input-wrap">
      <span class="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M11 4a7 7 0 1 0 4.42 12.43l4.57 4.57 1.41-1.41-4.57-4.57A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"></path>
        </svg>
      </span>
      <input
        type="search"
        bind:value={query}
        class="search-input"
        placeholder="Search moves, tags, or athlete name"
      />
      {#if query}
        <button type="button" class="search-clear" on:click={() => (query = '')}>Reset</button>
      {/if}
    </div>
    <p class="search-meta text-sm text-muted">
      Showing {filteredMoves.length} of {libraryMoves.length} moves
    </p>
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
    display: grid;
    gap: 0.55rem;
    margin-bottom: 1.4rem;
    max-width: 760px;
    padding: 0.8rem;
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in oklch, var(--color-primary) 25%, var(--color-border));
    background:
      linear-gradient(180deg, color-mix(in oklch, var(--color-primary) 8%, var(--color-surface)) 0%, var(--color-surface) 100%);
  }

  .search-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    padding: 0.25rem 0.35rem;
    transition: border-color 0.16s, box-shadow 0.16s;
  }

  .search-input-wrap:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 20%, transparent);
  }

  .search-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    color: color-mix(in oklch, var(--color-primary) 65%, var(--color-text));
    flex-shrink: 0;
  }

  .search-icon svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .search-input {
    flex: 1;
    min-height: 42px;
    border: none;
    background: transparent;
    padding: 0.25rem 0.2rem;
  }

  .search-input:focus {
    box-shadow: none;
  }

  .search-clear {
    min-height: 36px;
    border: 1px solid color-mix(in oklch, var(--color-primary) 25%, var(--color-border));
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 9%, var(--color-surface));
    color: var(--color-text);
    font-weight: 600;
    font-size: 0.78rem;
    padding: 0.35rem 0.8rem;
    transition: background 0.15s, border-color 0.15s;
  }

  .search-clear {
    cursor: pointer;
  }

  .search-clear:hover {
    background: color-mix(in oklch, var(--color-primary) 16%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-primary) 38%, var(--color-border));
  }

  .search-meta {
    padding-inline: 0.2rem;
  }

  @media (max-width: 640px) {
    .search-shell {
      padding: 0.65rem;
    }

    .search-input-wrap {
      padding: 0.2rem 0.3rem;
    }

    .search-input {
      min-height: 40px;
    }
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
