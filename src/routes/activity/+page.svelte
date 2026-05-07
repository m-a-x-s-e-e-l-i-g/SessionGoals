<script lang="ts">
  import { getActivities, getActivityStats, deleteActivity } from '$lib/data/activities';
  import { getGoalById } from '$lib/data/goals';
  import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
  import ActivityForm from '$lib/components/ActivityForm.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatActivityType, formatDuration } from '$lib/utils/format';

  let activities = getActivities();
  let visibleCount = 10;
  let recentActivities = activities.slice(0, visibleCount);
  let stats = getActivityStats(7);
  let showDeleteDialog = false;
  let isDeleting = false;
  let activityToDeleteId: string | null = null;

  function refreshActivityView() {
    activities = getActivities();
    stats = getActivityStats(7);
  }

  $: recentActivities = activities.slice(0, visibleCount);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function getGoalLink(goalId: string | undefined) {
    if (!goalId) return null;
    return getGoalById(goalId);
  }

  function getStreakMessage(streak: number) {
    if (streak >= 30) return 'That is no longer a streak. It is a training identity.';
    if (streak >= 14) return 'Two clean weeks in a row. Keep the pressure on.';
    if (streak >= 7) return 'A full week locked in. This is where momentum starts to feel real.';
    if (streak >= 3) return 'You are building rhythm. Do not let the line break now.';
    if (streak >= 1) return 'A fresh streak counts. Protect tomorrow and it gets louder.';
    return 'One session is enough to light the board back up.';
  }

  function getCadenceLabel(activeDays: number) {
    if (activeDays >= 5) return 'High cadence week';
    if (activeDays >= 3) return 'Solid session rhythm';
    if (activeDays >= 1) return 'Momentum is building';
    return 'No sessions in the last 7 days';
  }

  function getMilestoneLabel(streak: number) {
    if (streak >= 30) return '30-day marker';
    if (streak >= 14) return '2-week run';
    if (streak >= 7) return 'Week locked';
    return 'Start today';
  }

  function handleDeleteActivity(id: string) {
    activityToDeleteId = id;
    showDeleteDialog = true;
  }

  async function handleConfirmDeleteActivity() {
    if (!activityToDeleteId) return;
    isDeleting = true;
    try {
      await deleteActivity(activityToDeleteId);
      refreshActivityView();
    } finally {
      isDeleting = false;
      showDeleteDialog = false;
      activityToDeleteId = null;
    }
  }
</script>

<svelte:head>
  <title>Activity — SessionGoals</title>
</svelte:head>

<ConfirmDialog
  isOpen={showDeleteDialog}
  title="Delete session?"
  message="This session will be removed permanently."
  confirmLabel="Delete session"
  cancelLabel="Cancel"
  isDangerous={true}
  isLoading={isDeleting}
  on:confirm={handleConfirmDeleteActivity}
  on:cancel={() => {
    showDeleteDialog = false;
    activityToDeleteId = null;
  }}
/>

<div class="container page activity-page">
  <div class="page-header activity-header">
    <div>
      <p class="page-eyebrow">Training log</p>
      <h1 class="page-title activity-title">Your sessions should feel earned on the page too.</h1>
    </div>
    <p class="page-deck">
      Track parkour and support work together, spot the gaps before they turn into weeks,
      and keep enough context that tomorrow's training starts with intent.
    </p>
  </div>

  <section class="stats-row" aria-label="Training summary">
    <article class="stat-box stat-box-hero">
      <p class="stat-kicker">Current momentum</p>
      <div class="stat-hero-line">
        <p class="stat-number stat-number-hero">{stats.streak}</p>
        <div class="stat-hero-copy">
          <p class="stat-unit">day streak</p>
          <p class="stat-story">{getStreakMessage(stats.streak)}</p>
        </div>
      </div>

      <div class="stat-badges">
        <span class="stat-badge">{getCadenceLabel(stats.activeDays)}</span>
        <span class="stat-badge stat-badge-muted">{getMilestoneLabel(stats.streak)}</span>
      </div>
    </article>

    <article class="stat-box stat-box-secondary">
      <p class="stat-kicker">Session count</p>
      <p class="stat-number">{stats.activeDays}</p>
      <p class="stat-label">Sessions in the last 7 days</p>
      <p class="stat-context">Enough frequency to spot the pattern, not just remember the feeling.</p>
    </article>

    <article class="stat-box stat-box-secondary">
      <p class="stat-kicker">Total load</p>
      <p class="stat-number">{formatDuration(stats.totalDuration)}</p>
      <p class="stat-label">Minutes logged this week</p>
      <p class="stat-context">Volume matters when you want the heatmap to mean something.</p>
    </article>

    <article class="stat-box stat-box-secondary">
      <p class="stat-kicker">Average session</p>
      <p class="stat-number">{formatDuration(stats.averageDuration)}</p>
      <p class="stat-label">Minutes per session</p>
      <p class="stat-context">The shape of the week matters as much as the raw count.</p>
    </article>
  </section>

  <div class="activity-main-grid">
    <ActivityForm on:logged={refreshActivityView} />
    <ActivityHeatmap {activities} />
  </div>

  <section class="recent-section">
    <div class="section-heading">
      <div>
        <p class="section-eyebrow">Recent sessions</p>
        <h2 class="section-title">What you actually did, not what you meant to do</h2>
      </div>
      <p class="section-deck">Use the notes to leave a handhold for the next session instead of starting cold.</p>
    </div>

    {#if recentActivities.length === 0}
      <p class="text-muted">No activity logged yet. Start training!</p>
    {:else}
      <div class="activity-list">
        {#each recentActivities as activity}
          <div class="activity-item card">
            <div class="activity-date-block">
              <p class="activity-date-label">{formatDate(activity.date)}</p>
              <p class="activity-date-note">{formatActivityType(activity.activityType)} session</p>
            </div>
            <div class="activity-details">
              <div class="activity-meta">
                <span class="activity-type-badge">{formatActivityType(activity.activityType)}</span>
                {#if activity.duration}
                  <span class="activity-duration">{formatDuration(activity.duration)}</span>
                {/if}
                {#if activity.linkedGoalId}
                  <span class="activity-goal">
                    Goal focus: {getGoalLink(activity.linkedGoalId)?.title || 'Goal'}
                  </span>
                {/if}
              </div>
              <div class="activity-item-actions">
                <button
                  type="button"
                  class="btn btn-ghost activity-delete-button"
                  on:click={() => handleDeleteActivity(activity.id)}
                  aria-label="Delete this session"
                >
                  Delete
                </button>
              </div>
              {#if activity.notes}
                <p class="activity-notes">{activity.notes}</p>
              {:else}
                <p class="activity-notes activity-notes-empty">No notes logged for this session.</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      {#if activities.length > visibleCount}
        <div class="load-more-wrap">
          <button type="button" class="btn btn-ghost" on:click={() => (visibleCount += 10)}>Meer laden</button>
        </div>
      {/if}
    {/if}
  </section>
</div>

<style>
  .activity-page {
    padding-bottom: 3rem;
  }

  .activity-header {
    align-items: end;
    margin-bottom: 2.5rem;
  }

  .page-eyebrow,
  .section-eyebrow,
  .stat-kicker {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .page-eyebrow,
  .section-eyebrow {
    color: var(--color-accent);
    margin-bottom: 0.5rem;
  }

  .activity-title {
    max-width: 12ch;
    font-size: clamp(2.8rem, 7vw, 4.9rem);
    line-height: 0.92;
  }

  .page-deck,
  .section-deck {
    max-width: 45ch;
    color: var(--color-text-muted);
    font-size: 1rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: 1.7fr repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-box {
    background:
      linear-gradient(180deg, color-mix(in oklch, var(--color-surface) 88%, var(--color-primary) 12%), var(--color-surface));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.35rem;
    min-height: 100%;
    position: relative;
    overflow: hidden;
  }

  .stat-box::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 4px;
    background: color-mix(in oklch, var(--color-accent) 62%, transparent);
    opacity: 0.9;
  }

  .stat-box-hero {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 22%, transparent), transparent 50%),
      linear-gradient(160deg, color-mix(in oklch, var(--color-surface) 72%, var(--color-primary) 28%), var(--color-surface));
  }

  .stat-box-secondary {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stat-number {
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 5vw, 3.4rem);
    font-weight: 800;
    color: var(--color-primary);
    line-height: 0.88;
    margin-bottom: 0.5rem;
  }

  .stat-number-hero {
    font-size: clamp(4.6rem, 10vw, 7.8rem);
    margin-bottom: 0;
  }

  .stat-hero-line {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1.15rem;
  }

  .stat-hero-copy {
    display: grid;
    gap: 0.35rem;
    padding-bottom: 0.45rem;
  }

  .stat-unit {
    font-family: var(--font-display);
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 0.95;
  }

  .stat-story,
  .stat-context {
    color: var(--color-text-muted);
    font-size: 0.93rem;
    max-width: 34ch;
  }

  .stat-story {
    color: color-mix(in oklch, var(--color-text) 76%, var(--color-primary));
  }

  .stat-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .stat-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2.1rem;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 14%, var(--color-surface));
    border: 1px solid color-mix(in oklch, var(--color-primary) 30%, var(--color-border));
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .stat-badge-muted {
    background: color-mix(in oklch, var(--color-accent) 10%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 25%, var(--color-border));
  }

  .activity-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    align-items: start;
    margin-bottom: 2.5rem;
  }

  .stat-label {
    font-size: 0.86rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: color-mix(in oklch, var(--color-text-muted) 85%, var(--color-text));
  }

  .recent-section {
    margin-top: 0.5rem;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 0.95;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .activity-item {
    display: grid;
    grid-template-columns: minmax(150px, 170px) 1fr;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.1rem;
  }

  .activity-date-block {
    display: grid;
    gap: 0.3rem;
  }

  .activity-date-label {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
  }

  .activity-date-note {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .activity-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .activity-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .activity-type-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-accent) 12%, var(--color-surface));
    color: var(--color-accent);
    border: 1px solid color-mix(in oklch, var(--color-accent) 28%, var(--color-border));
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .activity-duration,
  .activity-goal {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    letter-spacing: 0.02em;
  }

  .activity-goal {
    background: color-mix(in oklch, var(--color-primary) 10%, var(--color-surface));
    color: color-mix(in oklch, var(--color-primary) 78%, var(--color-text));
    border: 1px solid color-mix(in oklch, var(--color-primary) 26%, var(--color-border));
  }

  .activity-notes {
    font-size: 0.9rem;
    color: var(--color-text);
    margin: 0;
    max-width: 62ch;
  }

  .activity-notes-empty {
    color: var(--color-text-muted);
    font-style: italic;
  }

  .activity-item-actions {
    display: flex;
    justify-content: flex-end;
  }

  .activity-delete-button {
    min-height: 44px;
  }

  .load-more-wrap {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }

  @media (prefers-color-scheme: dark) {
    .activity-goal {
      background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    }
  }

  @media (max-width: 960px) {
    .stats-row,
    .activity-main-grid {
      grid-template-columns: 1fr;
    }

    .section-heading,
    .activity-header {
      align-items: start;
    }
  }

  @media (max-width: 640px) {
    .stats-row {
      gap: 0.75rem;
    }

    .stat-box {
      padding: 1rem;
    }

    .stat-hero-line,
    .section-heading {
      grid-template-columns: 1fr;
      display: grid;
    }

    .activity-title {
      max-width: 10ch;
      font-size: clamp(2.4rem, 10vw, 3.3rem);
    }

    .activity-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  @media (max-width: 420px) {
    .stat-number-hero {
      font-size: 4.1rem;
    }

    .stat-unit {
      font-size: 1.2rem;
    }
  }

  .activity-main-grid :global(.activity-form-card),
  .activity-main-grid :global(.heatmap-container) {
    margin-bottom: 0;
  }
</style>
