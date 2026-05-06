<script lang="ts">
  import { getGoals, getMyGoals } from '$lib/data/goals';
  import { getMyLists, getExplorableLists, getListById } from '$lib/data/lists';
  import { getTrackedProgress } from '$lib/data/listProgress';
  import { getSpots } from '$lib/data/spots';
  import { getActivityForDate, getActivityStats } from '$lib/data/activities';
  import type { Goal, Spot } from '$lib/types';
  import GoalCard from '$lib/components/GoalCard.svelte';

  const myGoals = getMyGoals();
  const recentGoals = myGoals.slice(0, 4);
  const myLists = getMyLists();
  const trackedProgress = getTrackedProgress();
  const trackedListIds = new Set(trackedProgress.map((p) => p.sourceListId));
  const trackedLists = getExplorableLists().filter((l) => trackedListIds.has(l.id));
  const lists = [...myLists, ...trackedLists].slice(0, 4);

  const allGoals = getGoals();
  const goalById = new Map(allGoals.map((goal) => [goal.id, goal]));
  const trackedGoals: Goal[] = trackedProgress.flatMap((progress) => {
    const list = getListById(progress.sourceListId);
    if (!list) return [];
    return list.items
      .map((item) => goalById.get(item.goalId) ?? item.goal)
      .filter((goal): goal is Goal => !!goal);
  });

  const actionGoals = [...myGoals, ...trackedGoals].filter((goal) => !!goal.spotId);
  const actionSpotCounts = new Map<string, number>();
  for (const goal of actionGoals) {
    const spotId = goal.spotId;
    if (!spotId) continue;
    actionSpotCounts.set(spotId, (actionSpotCounts.get(spotId) ?? 0) + 1);
  }

  const spotById = new Map(getSpots().map((spot) => [spot.id, spot]));
  const spots: Spot[] = Array.from(actionSpotCounts.keys())
    .map((spotId) => spotById.get(spotId))
    .filter((spot): spot is Spot => !!spot)
    .slice(0, 6);

  const today = new Date().toISOString().split('T')[0];
  const todayActivity = getActivityForDate(today);
  const activityStats = getActivityStats(7);

  function getStreakMessage(streak: number) {
    if (streak >= 30) return 'This week is part of a real training run now.';
    if (streak >= 14) return 'Two clean weeks. Keep the pressure on.';
    if (streak >= 7) return 'A full week locked in.';
    if (streak >= 3) return 'Rhythm is starting to build.';
    if (streak >= 1) return 'Fresh streak. Protect tomorrow.';
    return 'No streak yet. One session changes the board.';
  }

  function getCadenceLabel(activeDays: number) {
    if (activeDays >= 5) return 'High cadence week';
    if (activeDays >= 3) return 'Solid session rhythm';
    if (activeDays >= 1) return 'Momentum building';
    return 'No sessions this week';
  }
</script>

<svelte:head>
  <title>SessionGoals — Dashboard</title>
</svelte:head>

<div class="container page">
  <section class="hero">
    <h1 class="hero-title">
      Train what's next.
      <span class="hero-accent">Plan your session.</span>
    </h1>
    <p class="hero-sub">
      Your own goals, inspiration, and lists come first. Then explore public lists from others and track your own progress.
    </p>
    <div class="hero-actions">
      <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
      <a href="/goals" class="btn btn-ghost">Browse Goals</a>
    </div>
  </section>

  <section class="activity-highlight">
    <div class="activity-highlight-copy">
      <p class="activity-eyebrow">Activity</p>
      <div class="activity-status">
        <div class="activity-stat activity-stat--hero">
          <p class="stat-value">{activityStats.streak}</p>
          <div>
            <p class="stat-label">Day streak</p>
            <p class="activity-story">{getStreakMessage(activityStats.streak)}</p>
          </div>
        </div>
        <div class="activity-stat-grid">
          <div class="activity-stat">
            <p class="stat-value">{activityStats.activeDays}</p>
            <p class="stat-label">Sessions in 7 days</p>
          </div>
          <div class="activity-stat">
            <p class="stat-value">{activityStats.totalDuration}</p>
            <p class="stat-label">Minutes this week</p>
          </div>
        </div>
      </div>

      <div class="activity-badges">
        <span class="activity-badge">{getCadenceLabel(activityStats.activeDays)}</span>
        <span class="activity-badge activity-badge--muted">Avg {activityStats.averageDuration} min</span>
      </div>
    </div>

    <div class="activity-cta-block">
      {#if todayActivity}
        <p class="activity-logged">Logged today{#if todayActivity.duration} · {todayActivity.duration} min{/if}</p>
      {:else}
        <p class="activity-prompt">No session logged today yet.</p>
      {/if}
      <a href="/activity" class="activity-link">Open activity board →</a>
      <p class="activity-caption">Quick log, heatmap, and recent sessions in one place.</p>
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2 class="section-title section-title--goals">Recent Goals</h2>
      <a href="/goals" class="text-sm">View all →</a>
    </div>
    <div class="grid-cards">
      {#each recentGoals as goal}
        <GoalCard {goal} />
      {/each}
    </div>
  </section>

  <div class="secondary-grid">
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Your Lists</h2>
        <a href="/lists" class="text-sm">View all →</a>
      </div>
      <div class="lists-stack">
        {#if lists.length === 0}
          <a href="/lists/new" class="list-row">
            <span class="list-row-name">Create your first list</span>
            <span class="list-row-count">+</span>
          </a>
        {:else}
          {#each lists as list}
            <a href="/lists/{list.id}" class="list-row">
              <span class="list-row-name">
                {list.name}
                {#if trackedListIds.has(list.id)}
                  <span class="list-row-tracked">Tracking</span>
                {/if}
              </span>
              <span class="list-row-count">{list.items.length}</span>
            </a>
          {/each}
        {/if}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Spots</h2>
        <a href="/spots" class="text-sm">Explore →</a>
      </div>
      {#if spots.length === 0}
        <p class="text-muted text-sm">No action spots yet. Add goals to spots to see them here.</p>
      {:else}
        <div class="spots-compact">
          {#each spots as spot}
            <div class="spot-compact">
              <span class="spot-compact-name">{spot.name}</span>
              {#if spot.city}
                <span class="spot-compact-city text-muted text-sm">{spot.city}</span>
              {/if}
              <span class="spot-compact-count">
                {actionSpotCounts.get(spot.id)} goal{actionSpotCounts.get(spot.id) === 1 ? '' : 's'}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .hero {
    padding: 3.5rem 0 3rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 2.5rem;
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 6vw, 3.75rem);
    font-weight: 800;
    letter-spacing: 0.01em;
    line-height: 1.1;
    display: flex;
    flex-direction: column;
    gap: 0.15em;
  }

  .hero-accent {
    color: var(--color-primary);
  }

  .hero-sub {
    color: var(--color-text-muted);
    font-size: 1.05rem;
    margin: 1.25rem 0 1.75rem;
    max-width: 52ch;
    line-height: 1.6;
  }

  .hero-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Activity highlight */
  .activity-highlight {
    background:
      radial-gradient(circle at top left, color-mix(in oklch, var(--color-primary) 20%, transparent), transparent 48%),
      linear-gradient(
        135deg,
        color-mix(in oklch, var(--color-surface) 90%, var(--color-primary) 10%),
        var(--color-surface)
      );
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1.6rem;
    margin-bottom: 2.5rem;
    display: grid;
    grid-template-columns: 1.4fr minmax(220px, 0.75fr);
    gap: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .activity-highlight::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 4px;
    background: color-mix(in oklch, var(--color-accent) 60%, transparent);
  }

  .activity-highlight-copy {
    display: grid;
    gap: 0.95rem;
  }

  .activity-eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .activity-status {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(210px, 0.8fr);
    gap: 1rem;
  }

  .activity-stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem 0.95rem;
    background: color-mix(in oklch, var(--color-surface) 86%, var(--color-primary) 14%);
    border: 1px solid color-mix(in oklch, var(--color-primary) 18%, var(--color-border));
    border-radius: var(--radius-sm);
  }

  .activity-stat--hero {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: end;
    gap: 0.9rem;
    background: color-mix(in oklch, var(--color-surface) 72%, var(--color-primary) 28%);
  }

  .activity-stat-grid {
    display: grid;
    gap: 0.8rem;
  }

  .activity-stat .stat-value {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 0.92;
  }

  .activity-stat--hero .stat-value {
    font-size: clamp(3.8rem, 7vw, 5.8rem);
  }

  .activity-stat .stat-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .activity-story {
    margin-top: 0.35rem;
    max-width: 28ch;
    color: color-mix(in oklch, var(--color-text) 78%, var(--color-primary));
    font-size: 0.92rem;
  }

  .activity-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .activity-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklch, var(--color-primary) 30%, var(--color-border));
    background: color-mix(in oklch, var(--color-primary) 12%, var(--color-surface));
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .activity-badge--muted {
    background: color-mix(in oklch, var(--color-accent) 10%, var(--color-surface));
    border-color: color-mix(in oklch, var(--color-accent) 24%, var(--color-border));
  }

  .activity-cta-block {
    display: grid;
    align-content: start;
    gap: 0.65rem;
    padding-left: 0.5rem;
    border-left: 1px solid color-mix(in oklch, var(--color-primary) 18%, var(--color-border));
  }

  .activity-logged,
  .activity-prompt {
    font-size: 1rem;
    color: var(--color-text);
    margin: 0;
    font-weight: 600;
  }

  .activity-logged {
    color: color-mix(in oklch, var(--color-success) 72%, var(--color-text));
  }

  .activity-link {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .activity-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .activity-caption {
    color: var(--color-text-muted);
    font-size: 0.88rem;
    max-width: 24ch;
  }

  @media (prefers-color-scheme: dark) {
    .activity-highlight {
      background:
        radial-gradient(
          circle at top left,
          color-mix(in oklch, var(--color-primary) 14%, transparent),
          transparent 50%
        ),
        linear-gradient(
          135deg,
          color-mix(in oklch, var(--color-surface) 92%, var(--color-primary) 8%),
          var(--color-surface)
        );
    }

    .activity-stat {
      background: color-mix(in oklch, var(--color-surface) 94%, var(--color-primary) 6%);
      border-color: color-mix(in oklch, var(--color-primary) 14%, var(--color-border));
    }

    .activity-stat--hero {
      background: color-mix(in oklch, var(--color-surface) 86%, var(--color-primary) 14%);
    }
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .section-title--goals {
    font-size: 1.75rem;
  }

  /* Secondary grid: Lists + Spots side by side */
  .secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 640px) {
    .activity-highlight,
    .secondary-grid {
      grid-template-columns: 1fr;
    }

    .activity-status {
      grid-template-columns: 1fr;
    }

    .activity-cta-block {
      border-left: 0;
      padding-left: 0;
    }
  }

  /* Lists: compact row stack */
  .lists-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.7rem 0.9rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    text-decoration: none;
    color: var(--color-text);
    transition: border-color 0.15s, background 0.15s;
    min-height: 44px;
  }

  .list-row:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-2);
    text-decoration: none;
  }

  .list-row-name {
    font-size: 0.9rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .list-row-tracked {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: color-mix(in oklch, var(--color-primary) 72%, black);
    background: color-mix(in oklch, var(--color-primary) 14%, white);
    border: 1px solid color-mix(in oklch, var(--color-primary) 40%, var(--color-border));
    border-radius: 999px;
    padding: 0.1rem 0.4rem;
  }

  .list-row-count {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface-2);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    min-width: 1.5rem;
    text-align: center;
  }

  /* Spots: dense info grid */
  .spots-compact {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-sm);
  }

  .spot-compact {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.65rem 0.8rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .spot-compact-name {
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .spot-compact-city {
    font-size: 0.75rem;
  }

  .spot-compact-count {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    margin-top: 0.2rem;
  }
</style>

