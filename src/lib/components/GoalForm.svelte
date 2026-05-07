<script lang="ts">
  import type { Goal, GoalStatus, GoalType, Spot } from '$lib/types';

  export let submitting = false;
  export let error: string | undefined = undefined;
  export let submitLabel = 'Save Goal';
  export let cancelHref = '/goals';
  export let initial: {
    type: GoalType;
    title: string;
    description?: string;
    status: GoalStatus;
    difficulty?: number;
    sourceUrl?: string;
  } = {
    type: 'move',
    title: '',
    description: '',
    status: 'want_to_try',
    difficulty: undefined,
    sourceUrl: '',
  };
  export let initialSpot: Spot | null = null;
  export let availableSubgoals: Goal[] = [];
  export let initialSubgoalIds: string[] = [];

  let type: GoalType = initial.type;
  let isDone = initial.status === 'done';
  let spotQuery = initialSpot?.name ?? '';
  let spotResults: Spot[] = [];
  let selectedSpot: Spot | null = initialSpot;
  let spotLoading = false;
  let spotError: string | undefined = undefined;
  let hiddenSpotImages = new Set<string>();
  let selectedSubgoalIds: string[] = [...initialSubgoalIds];

  function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;

    if (imageUrl.startsWith('/api/image-proxy')) {
      return imageUrl;
    }

    const normalized = imageUrl.startsWith('/') ? `https://parkour.spot${imageUrl}` : imageUrl;
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

  $: if (type !== 'spot') {
    selectedSpot = null;
    spotResults = [];
    spotError = undefined;
  }

  $: currentStatus = (isDone ? 'done' : 'want_to_try') as GoalStatus;
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
      value={initial.title}
    />
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="type">Type *</label>
      <select id="type" name="type" bind:value={type} required>
        <option value="move">Move</option>
        <option value="spot">Spot</option>
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
        step="1"
        placeholder="3"
        value={initial.difficulty ?? ''}
      />
    </div>
  </div>

  <div class="form-group form-check-group">
    <input type="hidden" name="status" value={currentStatus} />
    <label class="check-option" for="isDone">
      <input id="isDone" type="checkbox" bind:checked={isDone} />
      <span>
        <strong>Checked off</strong>
        <small class="text-muted">Mark this if the goal is already done.</small>
      </span>
    </label>
  </div>

  <div class="form-group">
    <label for="description">Description</label>
    <textarea id="description" name="description" placeholder="Notes, context, cues…">{initial.description ?? ''}</textarea>
  </div>

  <div class="form-group">
    <label for="sourceUrl">Link / URL</label>
    <input
      id="sourceUrl"
      name="sourceUrl"
      type="url"
      placeholder="https://youtube.com/…"
      value={initial.sourceUrl ?? ''}
    />
  </div>

  {#if type === 'move' && availableSubgoals.length > 0}
    <div class="form-group">
      <p class="form-section-label">Subgoals</p>
      <p class="text-sm text-muted subgoal-help">Break this move down into smaller move goals.</p>
      <div class="subgoals-grid">
        {#each availableSubgoals as candidate}
          <label class="chip-option">
            <input
              type="checkbox"
              name="subgoalIds"
              value={candidate.id}
              bind:group={selectedSubgoalIds}
            />
            <span>{candidate.title}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

  {#if type === 'spot'}
    <div class="form-group">
      <label for="spotQuery">Find Spot</label>
      <div class="spot-search-row">
        <input
          id="spotQuery"
          bind:value={spotQuery}
          type="text"
          placeholder="Search parkour.spot by name or city"
          on:keydown={(event) => event.key === 'Enter' && (event.preventDefault(), searchSpotResults())}
        />
        <button type="button" class="btn btn-ghost" on:click={searchSpotResults} disabled={spotLoading}>
          {spotLoading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <input type="hidden" name="spotId" value={selectedSpot?.id ?? ''} />
      <input type="hidden" name="spotPayload" value={selectedSpot ? JSON.stringify(selectedSpot) : ''} />

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

  {#if error}
    <p class="form-error">{error}</p>
  {/if}

  <div class="form-actions">
    <button type="submit" class="btn btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
    <a href={cancelHref} class="btn btn-ghost">Cancel</a>
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

  .form-check-group {
    margin-top: -0.15rem;
  }

  .check-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-2);
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

  .subgoal-help {
    margin-bottom: 0.45rem;
  }

  .form-section-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .subgoals-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
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
    background: var(--color-surface-2);
  }

  .chip-option {
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

  .chip-option:has(input:checked) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .chip-option input {
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

  @media (max-width: 720px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .spot-search-row {
      flex-direction: column;
      align-items: stretch;
    }

    .spot-result-image {
      width: 56px;
      height: 56px;
    }
  }
</style>
