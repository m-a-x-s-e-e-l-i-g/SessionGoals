<script lang="ts">
  import { page } from '$app/stores';
  import { getMyLists, getExplorableLists } from '$lib/data/lists';
  import { getUserById } from '$lib/data/users';
  import { getTrackedProgress, getProgressForList } from '$lib/data/listProgress';
  import { appStateStore } from '$lib/data/state';
  import ListCard from '$lib/components/ListCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';

  let publicQuery = '';

  $: isAuthenticated = !!$page.data.user;
  $: myLists = getMyLists();
  $: trackedProgress = getTrackedProgress();
  $: trackedListIds = new Set(trackedProgress.map((p) => p.sourceListId));
  $: trackedLists = getExplorableLists().filter((l) => trackedListIds.has(l.id));

  $: trackersByListId = (() => {
    const grouped = new Map<string, Set<string>>();
    for (const entry of $appStateStore.progress) {
      const users = grouped.get(entry.sourceListId) ?? new Set<string>();
      users.add(entry.userId);
      grouped.set(entry.sourceListId, users);
    }

    const counts = new Map<string, number>();
    for (const [listId, users] of grouped.entries()) {
      counts.set(listId, users.size);
    }
    return counts;
  })();

  $: explorableLists = getExplorableLists()
    .filter((l) => !trackedListIds.has(l.id))
    .sort((a, b) => {
      const aCount = trackersByListId.get(a.id) ?? 0;
      const bCount = trackersByListId.get(b.id) ?? 0;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name);
    });

  $: normalizedPublicQuery = publicQuery.trim().toLowerCase();
  $: filteredExplorableLists = explorableLists.filter((list) => {
    if (!normalizedPublicQuery) return true;

    const owner = list.userId ? getUserById(list.userId) : undefined;
    return (
      list.name.toLowerCase().includes(normalizedPublicQuery)
      || (list.description ?? '').toLowerCase().includes(normalizedPublicQuery)
      || (owner?.displayName ?? '').toLowerCase().includes(normalizedPublicQuery)
      || (owner?.username ?? '').toLowerCase().includes(normalizedPublicQuery)
    );
  });
</script>

<svelte:head>
  <title>Lists — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Lists</h1>
      {#if !isAuthenticated}
        <p class="text-muted">Browse public lists from other athletes.</p>
      {/if}
    </div>
    {#if isAuthenticated}
      <a href="/lists/new" class="btn btn-primary">+ New List</a>
    {/if}
  </div>

  {#if isAuthenticated}
    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Your Lists</h2>
      </div>
      {#if myLists.length === 0}
        <EmptyState
          icon="📋"
          title="No personal lists yet"
          message="Create your own training plans, competition lists, or wishlists first."
          actionHref="/lists/new"
          actionLabel="Create List"
        />
      {:else}
        <div class="grid-cards">
          {#each myLists as list}
            <ListCard {list} />
          {/each}
        </div>
      {/if}
    </section>

    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Following</h2>
      </div>
      {#if trackedLists.length === 0}
        <p class="text-muted">You are not tracking any lists yet.</p>
      {:else}
        <div class="grid-cards">
          {#each trackedLists as list}
            <ListCard
              {list}
              showOwner={true}
              isTracked={true}
              progress={(() => {
                const p = getProgressForList(list.id);
                return p ? { done: p.items.filter((i) => i.done).length, total: p.items.length } : undefined;
              })()}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <section class="section-block">
    <div class="section-header">
      <h2 class="section-title">{isAuthenticated ? 'Explore Public Lists' : 'Public Lists'}</h2>
    </div>

    <div class="public-search-wrap">
      <SearchBar
        bind:value={publicQuery}
        placeholder="Search public lists by name, owner, or description"
        ariaLabel="Search public lists"
        metaText={`Showing ${filteredExplorableLists.length} of ${explorableLists.length} public lists`}
      />
    </div>

    {#if explorableLists.length === 0}
      <p class="text-muted">No public lists from other athletes yet.</p>
    {:else if filteredExplorableLists.length === 0}
      <p class="text-muted">No public lists match your search.</p>
    {:else}
      <div class="grid-cards">
        {#each filteredExplorableLists as list}
          <ListCard {list} showOwner={true} trackerCount={trackersByListId.get(list.id) ?? 0} />
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .section-block {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
  }

  .public-search-wrap {
    margin-bottom: 1rem;
  }

  .public-search-wrap :global(.search-shell) {
    margin-bottom: 0;
    max-width: 820px;
  }
</style>
