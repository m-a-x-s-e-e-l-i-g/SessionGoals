<script lang="ts">
  import type { Tag } from '$lib/types';

  export let tags: Tag[] = [];
  export let submitting = false;
  export let error: string | undefined = undefined;
</script>

<div class="form-grid">
  <div class="form-group">
    <label for="title">Title *</label>
    <input
      id="title"
      name="title"
      type="text"
      required
      placeholder="e.g. Kong precision"
    />
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="type">Type *</label>
      <select id="type" name="type" required>
        <option value="move">🤸 Move</option>
        <option value="spot">📍 Spot</option>
        <option value="challenge">🏆 Challenge</option>
        <option value="inspiration">💡 Inspiration</option>
      </select>
    </div>

    <div class="form-group">
      <label for="status">Status *</label>
      <select id="status" name="status" required>
        <option value="idea">Idea</option>
        <option value="want_to_try">Want to try</option>
        <option value="training">Training</option>
        <option value="landed">Landed ✓</option>
        <option value="done">Done</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <div class="form-group">
      <label for="difficulty">Difficulty (1–5)</label>
      <input
        id="difficulty"
        name="difficulty"
        type="number"
        min="1"
        max="5"
        placeholder="3"
      />
    </div>
  </div>

  <div class="form-group">
    <label for="description">Description</label>
    <textarea id="description" name="description" placeholder="Notes, context, cues…"></textarea>
  </div>

  <div class="form-group">
    <label for="sourceUrl">Link / URL</label>
    <input
      id="sourceUrl"
      name="sourceUrl"
      type="url"
      placeholder="https://youtube.com/…"
    />
  </div>

  {#if tags.length > 0}
    <div class="form-group">
      <label>Tags</label>
      <div class="tags-grid">
        {#each tags as tag}
          <label class="tag-option">
            <input type="checkbox" name="tags" value={tag.id} />
            <span>{tag.name}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

  {#if error}
    <p class="form-error">{error}</p>
  {/if}

  <div class="form-actions">
    <button type="submit" class="btn btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : 'Save Goal'}
    </button>
    <a href="/goals" class="btn btn-ghost">Cancel</a>
  </div>
</div>

<style>
  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  .tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-option {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.8rem;
    cursor: pointer;
    text-transform: none;
    font-weight: 500;
    letter-spacing: normal;
    color: var(--color-text);
    transition: border-color 0.15s;
  }

  .tag-option:has(input:checked) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .tag-option input {
    width: auto;
    margin: 0;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .form-error {
    color: var(--color-danger);
    font-size: 0.85rem;
    padding: 0.5rem;
    background: rgba(242, 78, 78, 0.1);
    border-radius: var(--radius-sm);
  }
</style>
