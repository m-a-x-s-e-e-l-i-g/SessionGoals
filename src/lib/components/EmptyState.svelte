<script lang="ts">
  export let icon = '📭';
  export let title = 'Nothing here yet';
  export let message = '';
  export let actionHref: string | undefined = undefined;
  export let actionLabel = 'Create one';
</script>

<div class="empty-state">
  <div class="empty-icon">{icon}</div>
  <h3 class="empty-title">{title}</h3>
  {#if message}
    <p class="empty-message text-muted">{message}</p>
  {/if}
  {#if actionHref}
    <a href={actionHref} class="btn btn-primary">{actionLabel}</a>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--color-text-muted);
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .empty-message {
    max-width: 320px;
    font-size: 0.9rem;
  }
</style>
