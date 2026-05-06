<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<div class="app-shell">
  <a href="#main-content" class="skip-link">Skip to content</a>
  <Nav user={data.user} />
  <main id="main-content" class="site-main">
    <slot />
  </main>

  <footer class="site-footer">
    <div class="container site-footer-inner">
      <p class="text-sm text-muted">SessionGoals</p>
      <div class="site-footer-links">
        <a href="/terms" class="text-sm">Terms of Use</a>
        <a href="/privacy" class="text-sm">Privacy Policy</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .site-main {
    flex: 1;
  }

  .site-footer {
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .site-footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
    flex-wrap: wrap;
  }

  .site-footer-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>
