<script lang="ts">
  import { getLists } from '$lib/data/lists';
  import ListCard from '$lib/components/ListCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const lists = getLists();
</script>

<svelte:head>
  <title>Lists — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">Lists</h1>
    <a href="/lists/new" class="btn btn-primary">+ New List</a>
  </div>

  {#if lists.length === 0}
    <EmptyState
      icon="📋"
      title="No lists yet"
      message="Create training plans, competition lists, or wishlists."
      actionHref="/lists/new"
      actionLabel="Create List"
    />
  {:else}
    <div class="grid-cards">
      {#each lists as list}
        <ListCard {list} />
      {/each}
    </div>
  {/if}
</div>
