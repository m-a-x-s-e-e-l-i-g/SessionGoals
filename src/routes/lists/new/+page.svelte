<script lang="ts">
  import { goto } from '$app/navigation';
  import { createList } from '$lib/data/lists';
  import type { CreateGoalListInput, GoalListType } from '$lib/types';

  let submitting = false;
  let error: string | undefined;

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitting = true;
    error = undefined;

    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const name = (data.get('name') as string)?.trim();
    if (!name) {
      error = 'Name is required.';
      submitting = false;
      return;
    }

    const input: CreateGoalListInput = {
      name,
      description: (data.get('description') as string)?.trim() || undefined,
      type: (data.get('type') as GoalListType) ?? 'general',
    };

    try {
      const list = createList(input);
      goto(`/lists/${list.id}`);
    } catch (e) {
      error = 'Failed to create list.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>New List — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <h1 class="page-title">New List</h1>
  </div>

  <div class="form-card card">
    <form on:submit={handleSubmit}>
      <div class="form-group">
        <label for="name">Name *</label>
        <input id="name" name="name" type="text" required placeholder="e.g. Summer Session Goals" />
      </div>

      <div class="form-group">
        <label for="type">Type</label>
        <select id="type" name="type">
          <option value="training_plan">Training Plan</option>
          <option value="competition">Competition</option>
          <option value="wishlist">Wishlist</option>
          <option value="general">General</option>
        </select>
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" placeholder="What is this list for?"></textarea>
      </div>

      {#if error}
        <p class="form-error">{error}</p>
      {/if}

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create List'}
        </button>
        <a href="/lists" class="btn btn-ghost">Cancel</a>
      </div>
    </form>
  </div>
</div>

<style>
  .form-card {
    max-width: 560px;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .form-error {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
</style>
