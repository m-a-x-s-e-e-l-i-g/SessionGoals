<script lang="ts">
  import { page } from '$app/stores';

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/activity', label: 'Activity' },
    { href: '/goals', label: 'Goals' },
    { href: '/lists', label: 'Lists' },
    { href: '/people', label: 'People' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/spots', label: 'Spots' },
  ];

  let mobileOpen = false;

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }

  // Close mobile menu on route change
  $: $page.url.pathname, (mobileOpen = false);
</script>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="nav-brand">
      <span class="nav-name">SessionGoals</span>
    </a>

    <ul class="nav-links" class:open={mobileOpen} aria-label="Main navigation">
      {#each links as link}
        <li>
          <a
            href={link.href}
            class="nav-link"
            class:active={$page.url.pathname === link.href ||
              (link.href !== '/' && $page.url.pathname.startsWith(link.href))}
          >
            {link.label}
          </a>
        </li>
      {/each}
      <li class="nav-cta-mobile">
        <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
      </li>
    </ul>

    <a href="/goals/new" class="btn btn-primary nav-cta-desktop">+ New Goal</a>

    <button
      class="nav-hamburger"
      on:click={toggleMobile}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
    >
      <span class="bar" class:open={mobileOpen}></span>
      <span class="bar" class:open={mobileOpen}></span>
      <span class="bar" class:open={mobileOpen}></span>
    </button>
  </div>
</nav>

<style>
  .nav {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-inner {
    display: flex;
    align-items: center;
    gap: 2rem;
    height: 60px;
    position: relative;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.3rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .nav-brand:hover {
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    list-style: none;
    gap: 0.25rem;
    flex: 1;
  }

  .nav-link {
    display: block;
    color: var(--color-text-muted);
    padding: 0.65rem 0.8rem;
    min-height: 44px;
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .nav-link:hover {
    color: var(--color-text);
    background: var(--color-surface-2);
    text-decoration: none;
  }

  .nav-link.active {
    color: var(--color-text);
    background: var(--color-surface-2);
  }

  .nav-cta-desktop {
    margin-left: auto;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .nav-cta-mobile {
    display: none;
  }

  /* Hamburger */
  .nav-hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 0.5rem;
    min-height: 44px;
    width: 44px;
    cursor: pointer;
    margin-left: auto;
  }

  .bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--color-text);
    border-radius: 2px;
    transition: transform 0.2s, opacity 0.2s;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .nav-inner {
      flex-wrap: wrap;
      height: auto;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .nav-links {
      display: none;
      flex-direction: column;
      width: 100%;
      gap: 0.25rem;
      padding-bottom: 0.5rem;
    }

    .nav-links.open {
      display: flex;
    }

    .nav-link {
      padding: 0.75rem 0.8rem;
    }

    .nav-cta-desktop {
      display: none;
    }

    .nav-cta-mobile {
      display: flex;
      padding: 0.5rem 0;
    }

    .nav-hamburger {
      display: flex;
      margin-left: auto;
    }
  }
</style>
