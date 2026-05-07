<script lang="ts">
  import { page } from '$app/stores';
  import { createGoal, getGoals } from '$lib/data/goals';
  import { getUserById } from '$lib/data/users';
  import { getSpotById } from '$lib/data/spots';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import type { CreateGoalInput, Goal } from '$lib/types';

  let query = '';
  let addingGoalId: string | null = null;
  let feedback: string | undefined = undefined;

  $: isAuthenticated = !!$page.data.user;
  $: currentUserId = $page.data.user?.id as string | undefined;

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

    return (
      title.includes(normalizedQuery)
      || description.includes(normalizedQuery)
      || ownerName.includes(normalizedQuery)
      || ownerHandle.includes(normalizedQuery)
    );
  });

  function toGoalCopyInput(goal: Goal): CreateGoalInput {
    return {
      type: goal.type,
      title: goal.title,
      description: goal.description ?? undefined,
      status: 'want_to_try',
      difficulty: goal.difficulty ?? undefined,
      spotId: goal.spotId ?? undefined,
      imageUrl: goal.imageUrl ?? undefined,
      sourceUrl: goal.sourceUrl ?? undefined,
    };
  }

  async function addGoalToMine(goal: Goal) {
    if (!isAuthenticated) return;
    if (goal.userId && goal.userId === currentUserId) return;
    if (addingGoalId) return;

    addingGoalId = goal.id;
    feedback = undefined;

    try {
      await createGoal(toGoalCopyInput(goal));
      feedback = `Added \"${goal.title}\" to your goals.`;
    } catch {
      feedback = 'Could not add this move right now. Please try again.';
    } finally {
      addingGoalId = null;
    }
  }
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

  <SearchBar
    bind:value={query}
    placeholder="Search moves or athlete name"
    ariaLabel="Search movement library"
    metaText={`Showing ${filteredMoves.length} of ${libraryMoves.length} moves`}
  />

  {#if feedback}
    <p class="library-feedback text-sm">{feedback}</p>
  {/if}

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
      message="Try a different move name or athlete."
    />
  {:else}
    <div class="grid-cards mt-2">
      {#each filteredMoves as goal}
        {@const owner = goal.userId ? getUserById(goal.userId) : undefined}
        {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId}
        <div class="library-card-wrap">
          <GoalCard
            {goal}
            onAddToMine={canAddToMine ? addGoalToMine : undefined}
            spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
          />
          <p class="library-meta text-muted text-sm">
            Added by {owner?.displayName ?? owner?.username ?? 'Unknown athlete'}
          </p>
          {#if addingGoalId === goal.id}
            <p class="text-sm text-muted">Adding to your goals...</p>
          {/if}
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

  :global(.search-shell) {
    margin-bottom: 1.4rem;
  }

  .library-card-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .library-meta {
    padding-inline: 0.15rem;
  }

  .library-feedback {
    margin: -0.55rem 0 1rem;
    color: var(--color-success);
  }
</style>
