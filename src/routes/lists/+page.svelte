<script lang="ts">
  import { page } from '$app/stores';
  import { getMyLists, getExplorableLists } from '$lib/data/lists';
  import { getTrackedProgress } from '$lib/data/listProgress';
  import ListCard from '$lib/components/ListCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  $: isAuthenticated = !!$page.data.user;
  const myLists = getMyLists();
  const trackedProgress = getTrackedProgress();
  const trackedListIds = new Set(trackedProgress.map((p) => p.sourceListId));
  const trackedLists = getExplorableLists().filter((l) => trackedListIds.has(l.id));
  const explorableLists = getExplorableLists().filter((l) => !trackedListIds.has(l.id));
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
            <ListCard {list} showOwner={true} isTracked={true} />
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <section class="section-block">
    <div class="section-header">
      <h2 class="section-title">{isAuthenticated ? 'Explore Public Lists' : 'Public Lists'}</h2>
    </div>
    {#if explorableLists.length === 0}
      <p class="text-muted">No public lists from other athletes yet.</p>
    {:else}
      <div class="grid-cards">
        {#each explorableLists as list}
          <ListCard {list} showOwner={true} />
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
</style>
