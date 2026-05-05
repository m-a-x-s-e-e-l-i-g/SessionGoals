<script lang="ts">
  import { page } from '$app/stores';

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/goals', label: 'Goals' },
    { href: '/lists', label: 'Lists' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/spots', label: 'Spots' },
  ];
</script>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="nav-brand">
      <span class="nav-logo">⚡</span>
      <span class="nav-name">SessionGoals</span>
    </a>

    <ul class="nav-links">
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
    </ul>

    <a href="/goals/new" class="btn btn-primary nav-cta">+ New Goal</a>
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
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    font-weight: 700;
    font-size: 1.1rem;
    white-space: nowrap;
  }

  .nav-logo {
    font-size: 1.3rem;
  }

  .nav-links {
    display: flex;
    list-style: none;
    gap: 0.25rem;
    flex: 1;
  }

  .nav-link {
    color: var(--color-text-muted);
    padding: 0.4rem 0.75rem;
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

  .nav-cta {
    margin-left: auto;
    white-space: nowrap;
  }
</style>
