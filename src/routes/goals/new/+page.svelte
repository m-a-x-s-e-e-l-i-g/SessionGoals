<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createGoal, getGoals } from '$lib/data/goals';
  import { addGoalToList, getListById } from '$lib/data/lists';
  import { getUserById } from '$lib/data/users';
  import { upsertSpot } from '$lib/data/spots';
  import ImageUploadField from '$lib/components/ImageUploadField.svelte';
  import type { CreateGoalInput, Goal, GoalType, Spot } from '$lib/types';
  import { getGoalVisualImageUrl } from '$lib/utils/media';

  let submitting = false;
  let error: string | undefined;
  let success: string | undefined;

  let modeTouched = false;
  let selectedType: GoalType = 'move';

  let title = '';
  let description = '';
  let difficulty = '';
  let isDone = false;
  let imageUrl = '';
  let sourceUrl = '';

  let moveQuery = '';

  let spotQuery = '';
  let spotResults: Spot[] = [];
  let selectedSpot: Spot | null = null;
  let spotLoading = false;
  let spotError: string | undefined = undefined;
  let hiddenSpotImages = new Set<string>();

  $: listId = $page.url.searchParams.get('listId') ?? undefined;
  $: sourceList = listId ? getListById(listId) : undefined;
  $: currentUserId = $page.data.user?.id as string | undefined;
  $: isAuthenticated = !!$page.data.user;

  $: urlType = $page.url.searchParams.get('type');
  $: if (!modeTouched && (urlType === 'spot' || urlType === 'move')) {
    selectedType = urlType;
  }

  $: moveTemplates = getGoals().filter((goal) => goal.type === 'move' && goal.userId !== currentUserId);
  $: normalizedMoveQuery = moveQuery.trim().toLowerCase();
  $: filteredMoveTemplates = moveTemplates
    .filter((goal) => {
      if (!normalizedMoveQuery) return true;
      const owner = goal.userId ? getUserById(goal.userId) : undefined;
      return (
        goal.title.toLowerCase().includes(normalizedMoveQuery)
        || (goal.description ?? '').toLowerCase().includes(normalizedMoveQuery)
        || (owner?.displayName ?? '').toLowerCase().includes(normalizedMoveQuery)
        || (owner?.username ?? '').toLowerCase().includes(normalizedMoveQuery)
      );
    })
    .slice(0, 12);

  $: if (selectedType !== 'spot') {
    spotResults = [];
    selectedSpot = null;
    spotError = undefined;
  }

  function chooseType(type: GoalType) {
    selectedType = type;
    modeTouched = true;
    error = undefined;
    success = undefined;
  }

  function getProxiedImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('/api/image-proxy')) return url;
    const normalized = url.startsWith('/') ? `https://parkour.spot${url}` : url;
    return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
  }

  function hideSpotImage(spotId: string) {
    hiddenSpotImages.add(spotId);
    hiddenSpotImages = hiddenSpotImages;
  }

  async function searchSpotResults() {
    const q = spotQuery.trim();
    if (!q) {
      spotResults = [];
      spotError = undefined;
      return;
    }

    spotLoading = true;
    spotError = undefined;

    try {
      const res = await fetch(`/api/parkour-spot/spots?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to search spots');
      }

      spotResults = Array.isArray(data?.spots) ? data.spots : [];
    } catch (err: any) {
      spotResults = [];
      spotError = err?.message || 'Failed to search spots';
    } finally {
      spotLoading = false;
    }
  }

  function selectSpot(spot: Spot) {
    selectedSpot = spot;
    spotQuery = spot.name;
    spotResults = [];
  }

  function applyMoveTemplate(goal: Goal) {
    title = goal.title;
    description = goal.description ?? '';
    difficulty = goal.difficulty ? String(goal.difficulty) : '';
    imageUrl = goal.imageUrl ?? '';
    sourceUrl = goal.sourceUrl ?? '';
    selectedType = 'move';
    modeTouched = true;
    success = `Loaded \"${goal.title}\" into the form.`;
  }

  async function addExistingMove(goal: Goal) {
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    submitting = true;
    error = undefined;
    success = undefined;

    const input: CreateGoalInput = {
      type: 'move',
      title: goal.title,
      description: goal.description ?? undefined,
      status: 'want_to_try',
      difficulty: goal.difficulty ?? undefined,
      imageUrl: goal.imageUrl ?? undefined,
      sourceUrl: goal.sourceUrl ?? undefined,
    };

    try {
      const created = await createGoal(input);

      if (listId) {
        await addGoalToList(listId, created);
        goto(`/lists/${listId}`);
        return;
      }

      goto(`/goals/${created.id}`);
    } catch {
      error = 'Failed to add this move. Please try again.';
      submitting = false;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      goto('/auth/login');
      return;
    }

    submitting = true;
    error = undefined;
    success = undefined;

    const trimmedTitle = title.trim();
    if (selectedType === 'move' && !trimmedTitle) {
      error = 'Move title is required.';
      submitting = false;
      return;
    }

    if (selectedType === 'spot' && !selectedSpot) {
      error = 'Select a spot before creating a spot goal.';
      submitting = false;
      return;
    }

    const resolvedTitle = trimmedTitle || (selectedSpot ? `Session at ${selectedSpot.name}` : 'New goal');

    const input: CreateGoalInput = {
      type: selectedType,
      title: resolvedTitle,
      description: description.trim() || undefined,
      status: isDone ? 'done' : 'want_to_try',
      difficulty: difficulty ? Number(difficulty) : undefined,
      spotId: selectedType === 'spot' ? selectedSpot?.id : undefined,
      imageUrl: imageUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    };

    try {
      if (selectedType === 'spot' && selectedSpot) {
        await upsertSpot(selectedSpot);
      }

      const goal = await createGoal(input);

      if (listId) {
        await addGoalToList(listId, goal);
        goto(`/lists/${listId}`);
      } else {
        goto(`/goals/${goal.id}`);
      }
    } catch {
      error = 'Failed to create goal. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>New Goal — SessionGoals</title>
</svelte:head>

<div class="container page">
  <div class="page-header">
    <div>
      {#if sourceList}
        <a href="/lists/{sourceList.id}" class="back-link text-muted text-sm">← {sourceList.name}</a>
      {/if}
      <h1 class="page-title">New Goal</h1>
      {#if sourceList}
        <p class="text-muted text-sm">Will be added to <strong>{sourceList.name}</strong></p>
      {/if}
    </div>
  </div>

  <form class="form-card card" on:submit={handleSubmit}>
    <div class="mode-grid">
      <button
        type="button"
        class="mode-card"
        class:is-active={selectedType === 'move'}
        on:click={() => chooseType('move')}
      >
        <span class="mode-title">Move goal</span>
        <span class="mode-copy text-sm text-muted">Search existing moves or create your own.</span>
      </button>
      <button
        type="button"
        class="mode-card"
        class:is-active={selectedType === 'spot'}
        on:click={() => chooseType('spot')}
      >
        <span class="mode-title">Spot goal</span>
        <span class="mode-copy text-sm text-muted">Pick a spot and define what you want to do there.</span>
      </button>
    </div>

    {#if selectedType === 'move'}
      <div class="section-block">
        <h2 class="section-title">Find existing moves</h2>
        <p class="text-muted text-sm section-copy">Reuse community moves instantly or load one into the form below.</p>
        <input
          type="text"
          bind:value={moveQuery}
          placeholder="Search move name or athlete"
        />
        {#if filteredMoveTemplates.length > 0}
          <div class="template-list">
            {#each filteredMoveTemplates as template}
              {@const owner = template.userId ? getUserById(template.userId) : undefined}
              {@const preview = getGoalVisualImageUrl(template)}
              <article class="template-item">
                {#if preview}
                  <img
                    src={preview}
                    alt="{template.title} preview"
                    class="template-preview"
                    loading="lazy"
                  />
                {/if}
                <div class="template-content">
                  <p class="template-title">{template.title}</p>
                  {#if template.description}
                    <p class="text-sm text-muted template-description">{template.description}</p>
                  {/if}
                  <p class="text-sm text-muted">By {owner?.displayName ?? owner?.username ?? 'Unknown athlete'}</p>
                  <div class="template-actions">
                    <button type="button" class="btn btn-ghost btn-sm" on:click={() => applyMoveTemplate(template)}>
                      Use as template
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" on:click={() => addExistingMove(template)} disabled={submitting}>
                      Add to my goals
                    </button>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted empty-hint">No existing moves match this search. Create a new one below.</p>
        {/if}
      </div>
    {/if}

    <div class="section-block">
      <h2 class="section-title">{selectedType === 'spot' ? 'Spot goal details' : 'Move goal details'}</h2>

      <div class="form-group">
        <label for="title">{selectedType === 'move' ? 'Move title *' : 'Goal title (optional)'}</label>
        <input
          id="title"
          name="title"
          type="text"
          bind:value={title}
          required={selectedType === 'move'}
          placeholder={selectedType === 'move' ? 'e.g. Backflip on flat' : 'e.g. Sunset session line'}
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="difficulty">Difficulty (1-5)</label>
          <input id="difficulty" name="difficulty" type="number" min="1" max="5" step="1" bind:value={difficulty} placeholder="3" />
        </div>
        <div class="form-group form-check-group">
          <label class="check-option" for="isDone">
            <input id="isDone" type="checkbox" bind:checked={isDone} />
            <span>
              <strong>Checked off</strong>
              <small class="text-muted">Mark this if the goal is already done.</small>
            </span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="description">{selectedType === 'spot' ? 'What do you want to do there?' : 'Description'}</label>
        <textarea
          id="description"
          name="description"
          bind:value={description}
          placeholder={selectedType === 'spot' ? 'Line idea, challenge, constraints...' : 'Notes, context, cues...'}
        ></textarea>
      </div>

      {#if selectedType === 'spot'}
        <div class="form-group">
          <label for="spotQuery">Search spot *</label>
          <div class="spot-search-row">
            <input
              id="spotQuery"
              bind:value={spotQuery}
              type="text"
              placeholder="Search parkour.spot by name or city"
              on:keydown={(event) => event.key === 'Enter' && (event.preventDefault(), searchSpotResults())}
            />
            <button type="button" class="btn btn-ghost" on:click={searchSpotResults} disabled={spotLoading}>
              {spotLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {#if selectedSpot}
            <div class="spot-selected">
              <div class="spot-selected-name">📍 {selectedSpot.name}</div>
              <div class="text-sm text-muted">{[selectedSpot.city, selectedSpot.country].filter(Boolean).join(', ')}</div>
            </div>
          {/if}

          {#if spotError}
            <p class="form-error">{spotError}</p>
          {/if}

          {#if spotResults.length > 0}
            <div class="spot-results">
              {#each spotResults as spot}
                <button type="button" class="spot-result" on:click={() => selectSpot(spot)}>
                  {#if getProxiedImageUrl(spot.imageUrl) && !hiddenSpotImages.has(spot.id)}
                    <img
                      src={getProxiedImageUrl(spot.imageUrl)}
                      alt={spot.name}
                      class="spot-result-image"
                      loading="lazy"
                      on:error={() => hideSpotImage(spot.id)}
                    />
                  {/if}
                  <span class="spot-result-content">
                    <span class="spot-result-name">{spot.name}</span>
                    <span class="text-sm text-muted">{[spot.city, spot.country].filter(Boolean).join(', ')}</span>
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <ImageUploadField
        id="goalImageUpload"
        name="imageUrl"
        label="Image"
        bind:value={imageUrl}
        helperText="Upload an image. It is compressed locally before saving."
      />

      <div class="form-group">
        <label for="sourceUrl">Link URL</label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          bind:value={sourceUrl}
          placeholder="https://youtube.com/..."
        />
      </div>
    </div>

    {#if success}
      <p class="form-success">{success}</p>
    {/if}
    {#if error}
      <p class="form-error">{error}</p>
    {/if}

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving...' : 'Create Goal'}
      </button>
      <a href="/goals" class="btn btn-ghost">Cancel</a>
    </div>
  </form>
</div>

<style>
  .form-card {
    max-width: 860px;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .back-link {
    display: block;
    margin-bottom: 0.25rem;
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .mode-card {
    text-align: left;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
    padding: 0.95rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    cursor: pointer;
    color: var(--color-text);
  }

  .mode-card.is-active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--color-primary) 45%, transparent);
  }

  .mode-title {
    font-size: 1rem;
    font-weight: 700;
  }

  .section-block {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .section-copy {
    margin-top: -0.35rem;
  }

  .template-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .template-item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    padding: 0.75rem;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .template-preview {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
    flex-shrink: 0;
  }

  .template-content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .template-title {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .template-description {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .template-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .empty-hint {
    margin-top: -0.1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .form-check-group {
    margin-top: auto;
  }

  .check-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    cursor: pointer;
  }

  .check-option input {
    width: auto;
    margin: 0.15rem 0 0;
  }

  .check-option span {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .check-option small {
    font-size: 0.8rem;
  }

  .spot-search-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .spot-results {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .spot-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .spot-result:hover {
    border-color: var(--color-primary);
  }

  .spot-result-name,
  .spot-selected-name {
    font-weight: 600;
  }

  .spot-result-image {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--color-border);
    background: var(--color-surface-2);
  }

  .spot-result-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    min-width: 0;
  }

  .spot-selected {
    margin-top: 0.75rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .form-error,
  .form-success {
    font-size: 0.85rem;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
  }

  .form-error {
    color: var(--color-danger);
    background: rgba(242, 78, 78, 0.1);
  }

  .form-success {
    color: var(--color-success);
    background: color-mix(in oklch, var(--color-success) 13%, transparent);
  }

  @media (max-width: 760px) {
    .mode-grid,
    .form-row {
      grid-template-columns: 1fr;
    }

    .template-item {
      flex-direction: column;
    }

    .template-preview {
      width: 100%;
      height: 160px;
    }

    .spot-search-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
