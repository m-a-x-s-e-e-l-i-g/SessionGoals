<script lang="ts">
  import type { Tag } from '$lib/types';
  export let tag: Tag;
</script>

<span class="badge tag-badge">{tag.name}</span>

<style>
  .tag-badge {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
  }
</style>
