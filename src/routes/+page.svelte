<script lang="ts">
  import { getGoals } from '$lib/data/goals';
  import { getLists } from '$lib/data/lists';
  import { getSpots } from '$lib/data/spots';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import ListCard from '$lib/components/ListCard.svelte';
  import SpotCard from '$lib/components/SpotCard.svelte';

  const recentGoals = getGoals().slice(0, 4);
  const lists = getLists().slice(0, 3);
  const spots = getSpots().slice(0, 3);
</script>

<svelte:head>
  <title>SessionGoals — Dashboard</title>
</svelte:head>

<div class="container page">
  <section class="hero">
    <h1 class="hero-title">
      Train what's next.<br />
      <span class="hero-accent">Plan your session.</span>
    </h1>
    <p class="hero-sub">
      Save moves, spot-based goals, and challenges. Track progression. Discover spots.
    </p>
    <div class="hero-actions">
      <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
      <a href="/goals" class="btn btn-ghost">Browse Goals</a>
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2 class="section-title">Recent Goals</h2>
      <a href="/goals" class="text-sm">View all →</a>
    </div>
    <div class="grid-cards">
      {#each recentGoals as goal}
        <GoalCard {goal} />
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2 class="section-title">Lists</h2>
      <a href="/lists" class="text-sm">View all →</a>
    </div>
    <div class="grid-cards">
      {#each lists as list}
        <ListCard {list} />
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2 class="section-title">Spots</h2>
      <a href="/spots" class="text-sm">Explore →</a>
    </div>
    <div class="grid-cards">
      {#each spots as spot}
        <SpotCard {spot} />
      {/each}
    </div>
  </section>
</div>

<style>
  .hero {
    padding: 3rem 0 2.5rem;
    text-align: center;
  }

  .hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }

  .hero-accent {
    color: var(--color-primary);
  }

  .hero-sub {
    color: var(--color-text-muted);
    font-size: 1.05rem;
    margin: 1rem auto;
    max-width: 480px;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
  }
</style>
