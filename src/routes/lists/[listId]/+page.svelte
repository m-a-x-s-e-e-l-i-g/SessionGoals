<script lang="ts">
  import { page } from '$app/stores';
  import { getListById, deleteList } from '$lib/data/lists';
  import { goto } from '$app/navigation';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { formatListType } from '$lib/utils/format';

  $: listId = $page.params.listId;
  $: list = getListById(listId);

  function handleDelete() {
    if (confirm('Delete this list?')) {
      deleteList(listId);
      goto('/lists');
    }
  }
</script>

<svelte:head>
  <title>{list?.name ?? 'List'} — SessionGoals</title>
</svelte:head>

<div class="container page">
  {#if !list}
    <div class="not-found">
      <h2>List not found</h2>
      <a href="/lists" class="btn btn-ghost">← Back to Lists</a>
    </div>
  {:else}
    <div class="page-header">
      <div>
        <a href="/lists" class="back-link text-muted text-sm">← Lists</a>
        <h1 class="page-title">{list.name}</h1>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
      </div>
    </div>

    <div class="list-meta">
      <span class="badge list-type-badge">{formatListType(list.type)}</span>
      {#if list.description}
        <p class="text-muted">{list.description}</p>
      {/if}
    </div>

    {#if list.items.length === 0}
      <EmptyState
        icon="🎯"
        title="No goals in this list"
        message="Add goals to this list to start planning your session."
        actionHref="/goals/new"
        actionLabel="Create a Goal"
      />
    {:else}
      <div class="grid-cards mt-2">
        {#each list.items.sort((a, b) => a.position - b.position) as item}
          {#if item.goal}
            <div class="list-item">
              <span class="item-position">{item.position}</span>
              <div class="item-card">
                <GoalCard goal={item.goal} />
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
  }

  .back-link {
    display: block;
    margin-bottom: 0.25rem;
  }

  .list-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .list-type-badge {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    font-size: 0.72rem;
  }

  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .item-position {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin-top: 1.5rem;
  }

  .item-card {
    flex: 1;
  }
</style>
