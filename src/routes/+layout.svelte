<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import { page } from '$app/stores';
  import { initializeAppState } from '$lib/data/state';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: initializeAppState(data.appState);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/activity', label: 'Activity' },
    { href: '/goals', label: 'Goals' },
    { href: '/lists', label: 'Lists' },
    { href: '/people', label: 'People' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/spots', label: 'Spots' },
  ];

  const publicLinks = [
    { href: '/', label: 'Explore' },
    { href: '/lists', label: 'Lists' },
    { href: '/people', label: 'People' },
    { href: '/spots', label: 'Spots' },
  ];
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
        <a href="https://github.com/m-a-x-s-e-e-l-i-g/SessionGoals" class="text-sm" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>

    <nav class="footer-mobile-nav" aria-label="Mobile footer navigation">
      {#each (data.user ? navLinks : publicLinks) as link}
        <a
          href={link.href}
          class="footer-mobile-link"
          class:active={$page.url.pathname === link.href ||
            (link.href !== '/' && $page.url.pathname.startsWith(link.href))}
        >
          {link.label}
        </a>
      {/each}
    </nav>
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

  .footer-mobile-nav {
    display: none;
  }

  @media (max-width: 640px) {
    .site-footer {
      border-top-color: transparent;
      background: transparent;
    }

    .site-footer-inner {
      justify-content: center;
      padding-top: 0.5rem;
      padding-bottom: 0.75rem;
      gap: 0.5rem;
    }

    .site-footer-inner p {
      display: none;
    }

    .site-footer-links {
      gap: 1.25rem;
      justify-content: center;
    }

    .footer-mobile-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--color-border);
      margin-top: 0.25rem;
    }

    .footer-mobile-link {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.9rem 0.5rem;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--color-text-muted);
      text-decoration: none;
      text-align: center;
      transition: color 0.15s, background 0.15s;
    }

    .footer-mobile-link:hover,
    .footer-mobile-link.active {
      color: var(--color-text);
      background: var(--color-surface-2);
      text-decoration: none;
    }

    .footer-mobile-link.active {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
</style>
