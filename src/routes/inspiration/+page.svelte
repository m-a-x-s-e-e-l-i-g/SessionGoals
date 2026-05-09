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
  $: allGoals = getGoals();
  $: goalById = new Map(allGoals.map((goal) => [goal.id, goal]));

  function resolveLibraryMoveId(goal: Goal): string {
    let current: Goal = goal;
    const visited = new Set<string>();

    while (current.sourceGoalId) {
      if (visited.has(current.sourceGoalId)) {
        break;
      }
      visited.add(current.sourceGoalId);

      const source = goalById.get(current.sourceGoalId);
      if (!source) {
        return current.sourceGoalId;
      }

      current = source;
    }

    return current.id;
  }

  $: moveCommunityStats = (() => {
    const ownersByMoveId = new Map<string, Set<string>>();
    const checkedByMoveId = new Map<string, Set<string>>();

    for (const goal of allGoals) {
      if (goal.type !== 'move') continue;

      const moveId = resolveLibraryMoveId(goal);
      if (!goal.userId) continue;

      const owners = ownersByMoveId.get(moveId) ?? new Set<string>();
      owners.add(goal.userId);
      ownersByMoveId.set(moveId, owners);

      if (goal.status === 'done') {
        const checked = checkedByMoveId.get(moveId) ?? new Set<string>();
        checked.add(goal.userId);
        checkedByMoveId.set(moveId, checked);
      }
    }

    const stats = new Map<string, { haveCount: number; checkedCount: number }>();
    for (const [moveId, owners] of ownersByMoveId) {
      stats.set(moveId, {
        haveCount: owners.size,
        checkedCount: checkedByMoveId.get(moveId)?.size ?? 0,
      });
    }

    return stats;
  })();

  function formatMoveCommunityStats(goalId: string): string {
    const stats = moveCommunityStats.get(goalId);
    const haveCount = stats?.haveCount ?? 0;
    const checkedCount = stats?.checkedCount ?? 0;
    const athleteWord = haveCount === 1 ? 'athlete has' : 'athletes have';
    const checkedWord = checkedCount === 1 ? 'athlete checked this off' : 'athletes checked this off';

    return `${haveCount} ${athleteWord} this goal · ${checkedCount} ${checkedWord}`;
  }

  // Root IDs of every goal the current user owns (originals + tracked copies)
  $: myGoalRootIds = new Set(
    allGoals
      .filter((goal) => goal.userId === currentUserId)
      .map((goal) => resolveLibraryMoveId(goal))
  );

  $: libraryMoves = allGoals
    .filter((goal) => goal.type === 'move' && !goal.sourceGoalId)
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
      sourceGoalId: goal.id,
      title: goal.title,
      status: 'want_to_try',
    };
  }

  async function addGoalToMine(goal: Goal) {
    if (!isAuthenticated) return;
    if (goal.userId && goal.userId === currentUserId) return;
    if (myGoalRootIds.has(resolveLibraryMoveId(goal))) {
      feedback = `"${goal.title}" is already in your goals.`;
      return;
    }
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
        {@const alreadyAddedToMine = myGoalRootIds.has(resolveLibraryMoveId(goal))}
        {@const canAddToMine = isAuthenticated && goal.userId !== currentUserId && !alreadyAddedToMine}
        <div class="library-card-wrap">
          <GoalCard
            {goal}
            onAddToMine={canAddToMine ? addGoalToMine : undefined}
            spotName={goal.spotId ? getSpotById(goal.spotId)?.name : undefined}
            statusNote={isAuthenticated && alreadyAddedToMine ? 'In your goals' : undefined}
            insightNote={formatMoveCommunityStats(goal.id)}
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
