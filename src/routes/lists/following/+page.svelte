<script lang="ts">
  import { getTrackedProgress } from '$lib/data/listProgress';
  import { getListById } from '$lib/data/lists';
  import { getUserDisplayName } from '$lib/data/session';
  import EmptyState from '$lib/components/EmptyState.svelte';

  const tracked = getTrackedProgress()
    .map((progress) => {
      const list = getListById(progress.sourceListId);
      if (!list) return undefined;
      const done = progress.items.filter((item) => item.done).length;
      const total = progress.items.length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { progress, list, done, total, percent };
    })
    .filter(Boolean);
</script>

<svelte:head>
  <title>Following — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <div>
      <a href="/lists" class="back-link text-muted text-sm">← Lists</a>
      <h1 class="page-title">Following</h1>
      <p class="text-muted">Public lists you are tracking for your own progress.</p>
    </div>
  </div>

  {#if tracked.length === 0}
    <EmptyState
      icon="🧭"
      title="Not tracking any lists yet"
      message="Explore public lists and tap Track This List to start following progress."
      actionHref="/lists"
      actionLabel="Explore Lists"
    />
  {:else}
    <div class="grid-cards">
      {#each tracked as item}
        <a href="/lists/{item.list.id}" class="follow-card card">
          <div class="follow-head">
            <span class="badge">{item.done}/{item.total}</span>
            <span class="text-muted text-sm">{item.percent}%</span>
          </div>

          <h2 class="follow-title">{item.list.name}</h2>
          <p class="text-muted text-sm">By {getUserDisplayName(item.list.userId)}</p>

          <div class="progress-track" role="img" aria-label={`Progress ${item.done} out of ${item.total}`}>
            <div class="progress-fill" style={`width: ${item.percent}%`}></div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .back-link {
    display: inline-block;
    margin-bottom: 0.2rem;
  }

  .follow-card {
    text-decoration: none;
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    transition: border-color 0.15s;
  }

  .follow-card:hover {
    border-color: var(--color-primary);
    text-decoration: none;
  }

  .follow-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .follow-title {
    font-size: 1.02rem;
    font-weight: 700;
  }

  .progress-track {
    height: 8px;
    border-radius: 999px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--color-primary) 65%, black),
      var(--color-primary)
    );
    transition: width 0.2s;
  }
</style>
