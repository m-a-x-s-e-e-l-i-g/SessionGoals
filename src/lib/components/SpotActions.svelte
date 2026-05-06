<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import type { Spot, GoalList, Goal } from '$lib/types';
  import { createGoal } from '$lib/data/goals';
  import { addGoalToList, createList } from '$lib/data/lists';
  import { upsertSpot } from '$lib/data/spots';
  import { formatStatus } from '$lib/utils/format';

  export let spot: Spot;
  export let lists: GoalList[];
  export let goals: Goal[] = [];

  // Goals already linked to this spot
  $: linkedGoals = goals.filter((g) => g.spotId === spot.id);

  // Lists that contain any of those goals
  $: linkedLists = lists.filter((l) =>
    l.items.some((item) => linkedGoals.some((g) => g.id === item.goalId))
  );

  let mode: 'idle' | 'new-goal' | 'add-to-list' = 'idle';
  let addedToList: string | null = null;
  let newListName = '';

  // Inline goal form state
  let goalTitle = '';
  let goalDescription = '';

  function openNewGoal() {
    goalTitle = '';
    goalDescription = '';
    mode = 'new-goal';
  }

  function openListPicker() {
    newListName = '';
    mode = 'add-to-list';
  }

  function handleListAction() {
    openListPicker();
  }

  async function handleCreateNewList() {
    if (!newListName.trim()) return;
    const list = await createList({
      name: newListName.trim(),
      description: undefined,
      type: 'general',
      visibility: 'private',
    });
    newListName = '';
    await handleQuickAddToList(list.id);
  }

  async function submitNewGoal() {
    // Ensure the spot exists in the database before creating a goal
    const savedSpot = await upsertSpot(spot);
    const goal = await createGoal({
      type: 'spot',
      title: goalTitle.trim() || 'Spot visit',
      description: goalDescription.trim() || undefined,
      status: 'want_to_try',
      spotId: savedSpot.id,
      sourceUrl: undefined,
      tagIds: spot.tags.map((t) => t.id),
    });
    goto(`/goals/${goal.id}`);
  }

  async function handleQuickAddToList(listId: string) {
    // Quick add from +List: create a spot-visit goal and attach it immediately.
    const savedSpot = await upsertSpot(spot);
    const goal = await createGoal({
      type: 'spot',
      title: 'Spot visit',
      description: undefined,
      status: 'want_to_try',
      spotId: savedSpot.id,
      sourceUrl: undefined,
      tagIds: spot.tags.map((t) => t.id),
    });
    await addGoalToList(listId, goal);
    addedToList = listId;
    mode = 'idle';
    await invalidateAll();
  }

  async function handleAddToList(listId: string) {
    // Ensure the spot exists in the database before creating a goal
    const savedSpot = await upsertSpot(spot);
    const goal = await createGoal({
      type: 'spot',
      title: goalTitle.trim() || 'Spot visit',
      description: goalDescription.trim() || undefined,
      status: 'want_to_try',
      spotId: savedSpot.id,
      sourceUrl: undefined,
      tagIds: spot.tags.map((t) => t.id),
    });
    await addGoalToList(listId, goal);
    addedToList = listId;
    goalTitle = '';
    goalDescription = '';
    mode = 'idle';
    await invalidateAll();
  }
</script>

<div class="spot-actions">
  {#if linkedGoals.length > 0}
    <div class="linked-section">
      <p class="linked-label">Goals</p>
      <div class="linked-goals">
        {#each linkedGoals as goal}
          <a href="/goals/{goal.id}" class="linked-goal">
            <span class="linked-goal-title">{goal.title}</span>
            <span class="linked-goal-status status-{goal.status}">{formatStatus(goal.status)}</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if linkedLists.length > 0}
    <div class="linked-section">
      <p class="linked-label">In lists</p>
      <div class="linked-list-chips">
        {#each linkedLists as list}
          <a href="/lists/{list.id}" class="linked-list-chip">{list.name}</a>
        {/each}
      </div>
    </div>
  {/if}

  {#if mode === 'idle'}
    <div class="action-row">
      <button class="action-btn" on:click={openNewGoal}>
        + Goal
      </button>
      <button
        class="action-btn action-btn--secondary"
        on:click={handleListAction}
        title="Pick a list or create a new one"
      >
        + List
      </button>
    </div>
    {#if addedToList}
      {@const list = lists.find((l) => l.id === addedToList)}
      <p class="confirm-msg">Added to <strong>{list?.name ?? 'list'}</strong></p>
    {/if}

  {:else if mode === 'new-goal'}
    <form class="goal-form" on:submit|preventDefault={submitNewGoal}>
      <input
        class="goal-input"
        type="text"
        bind:value={goalTitle}
        placeholder="What do you want to do here? (optional)"
        maxlength={120}
        autofocus
      />
      <div class="goal-form-row">
        <p class="spot-visit-label">Spot visit</p>
        <button type="submit" class="action-btn">
          Save Goal
        </button>
      </div>
      <textarea
        class="goal-notes"
        bind:value={goalDescription}
        placeholder="Notes, cues, context… (optional)"
        rows="2"
      ></textarea>
      {#if lists.length > 0}
        <details class="list-details">
          <summary class="list-details-summary">Also add to a list</summary>
          <div class="list-picker-options">
            {#each lists as list}
              <button type="button" class="list-option" on:click={() => handleAddToList(list.id)}>
                {list.name}
              </button>
            {/each}
          </div>
        </details>
      {/if}
      <button type="button" class="cancel-btn" on:click={() => (mode = 'idle')}>Cancel</button>
    </form>

  {:else if mode === 'add-to-list'}
    <div class="list-picker">
      <p class="list-picker-label">Pick a list to add to:</p>
      <div class="list-picker-options">
        {#each lists as list}
          <button class="list-option" on:click={() => handleQuickAddToList(list.id)}>
            {list.name}
          </button>
        {/each}
      </div>
      <div class="list-picker-divider">or</div>
      <form class="list-creator-form" on:submit|preventDefault={handleCreateNewList}>
        <input
          type="text"
          bind:value={newListName}
          placeholder="Create a new list…"
          class="list-creator-input"
          maxlength={100}
        />
        <button type="submit" class="action-btn action-btn--sm" disabled={!newListName.trim()}>
          Create
        </button>
      </form>
      <button class="cancel-btn" on:click={() => (mode = 'idle')}>Cancel</button>
    </div>
  {/if}
</div>

<style>
  .spot-actions {
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  /* ── Linked goals & lists ── */

  .linked-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .linked-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .linked-goals {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .linked-goal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 0.3rem 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    text-decoration: none;
    color: var(--color-text);
    font-size: 0.82rem;
    transition: background 0.12s;
  }

  .linked-goal:hover {
    background: color-mix(in oklch, var(--color-primary) 10%, var(--color-surface-2));
    text-decoration: none;
  }

  .linked-goal-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .linked-goal-status {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .linked-list-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .linked-list-chip {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: border-color 0.12s, color 0.12s;
  }

  .linked-list-chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    text-decoration: none;
  }

  /* ── Inline goal form ── */

  .goal-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .goal-input {
    width: 100%;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.5rem 0.65rem;
    min-height: 40px;
    border: 1.5px solid var(--color-primary);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-family: inherit;
  }

  .goal-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 18%, transparent);
  }

  .goal-form-row {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }

  .spot-visit-label {
    flex: 1;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.35rem 0.55rem;
    min-height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    display: flex;
    align-items: center;
  }

  .goal-notes {
    width: 100%;
    font-size: 0.82rem;
    padding: 0.45rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-family: inherit;
    resize: none;
    min-height: unset;
  }

  .goal-notes:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .list-details {
    font-size: 0.82rem;
  }

  .list-details-summary {
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    list-style: none;
    padding: 0.2rem 0;
  }

  .list-details-summary:hover {
    color: var(--color-text);
  }

  .list-details[open] .list-details-summary {
    margin-bottom: var(--space-xs);
  }

  /* ── Action buttons ── */

  .action-row {
    display: flex;
    gap: var(--space-sm);
  }

  .action-btn {
    flex: 1;
    padding: 0.35rem 0.6rem;
    min-height: 36px;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--color-primary);
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    line-height: 1;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .action-btn--secondary {
    border-color: var(--color-border);
    color: var(--color-text-muted);
  }

  .action-btn--secondary:hover:not(:disabled) {
    background: var(--color-surface-2);
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .confirm-msg {
    font-size: 0.78rem;
    color: var(--color-success);
  }

  /* ── List picker ── */

  .list-picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .list-picker-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .list-picker-options {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .list-option {
    width: 100%;
    text-align: left;
    padding: 0.45rem 0.65rem;
    min-height: 36px;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
    color: var(--color-text);
    cursor: pointer;
    transition: border-color 0.13s, background 0.13s;
  }

  .list-option:hover {
    border-color: var(--color-primary);
    background: color-mix(in oklch, var(--color-primary) 8%, var(--color-surface-2));
  }

  .cancel-btn {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    padding: 0.2rem 0;
    cursor: pointer;
    min-height: unset;
  }

  .list-picker-divider {
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .list-creator-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .list-creator-input {
    width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem 0.65rem;
    min-height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
    color: var(--color-text);
    font-family: inherit;
  }

  .list-creator-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .action-btn--sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    min-height: 36px;
  }

  .cancel-btn:hover {
    color: var(--color-text);
  }
</style>
