<script lang="ts">
  import { page } from '$app/stores';
  import type { User } from '@supabase/supabase-js';

  export let user: User | null = null;

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
  let userMenuOpen = false;

  $: profileHref = user ? `/people/${user.id}` : '/people';
  $: accountLabel = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Account';

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }

  function closeUserMenu() {
    userMenuOpen = false;
  }

  // Close mobile menu on route change
  $: $page.url.pathname, (mobileOpen = false);
  $: $page.url.pathname, (userMenuOpen = false);
</script>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="nav-brand">
      <span class="nav-name">SessionGoals <span class="nav-preview">[preview]</span></span>
    </a>

    {#if user}
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
        <li class="nav-user-mobile">
          <button
            type="button"
            class="nav-user-trigger nav-user-trigger-mobile"
            on:click={toggleUserMenu}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span class="nav-user-avatar" aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>
            <span class="nav-user-copy">
              <span class="nav-user-name">{accountLabel}</span>
              <span class="nav-user-meta">Account</span>
            </span>
            <span class="nav-user-caret" class:open={userMenuOpen} aria-hidden="true">▾</span>
          </button>

          {#if userMenuOpen}
            <div class="nav-user-menu nav-user-menu-mobile" role="menu" aria-label="User menu">
              <a href={profileHref} class="nav-user-menu-item" role="menuitem" on:click={closeUserMenu}>
                View profile
              </a>
              <form method="POST" action="/auth/signout" class="nav-user-menu-form">
                <button type="submit" class="nav-user-menu-item nav-user-menu-item-button" role="menuitem">
                  Sign out
                </button>
              </form>
            </div>
          {/if}
        </li>
      </ul>

      <div class="nav-actions nav-cta-desktop">
        <a href="/goals/new" class="btn btn-primary">+ New Goal</a>
        <div class="nav-user-menu-wrap">
          <button
            type="button"
            class="nav-user-trigger"
            on:click={toggleUserMenu}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span class="nav-user-avatar" aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>
            <span class="nav-user-name">{accountLabel}</span>
            <span class="nav-user-caret" class:open={userMenuOpen} aria-hidden="true">▾</span>
          </button>

          {#if userMenuOpen}
            <div class="nav-user-menu" role="menu" aria-label="User menu">
              <a href={profileHref} class="nav-user-menu-item" role="menuitem" on:click={closeUserMenu}>
                View profile
              </a>
              <form method="POST" action="/auth/signout" class="nav-user-menu-form">
                <button type="submit" class="nav-user-menu-item nav-user-menu-item-button" role="menuitem">
                  Sign out
                </button>
              </form>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <ul class="nav-links nav-links-public" class:open={mobileOpen} aria-label="Public navigation">
        <li><a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>Explore</a></li>
        <li><a href="/lists" class="nav-link" class:active={$page.url.pathname.startsWith('/lists')}>Lists</a></li>
        <li><a href="/people" class="nav-link" class:active={$page.url.pathname.startsWith('/people')}>People</a></li>
        <li><a href="/spots" class="nav-link" class:active={$page.url.pathname.startsWith('/spots')}>Spots</a></li>
        <li class="nav-cta-mobile">
          <a href="/auth/login" class="btn btn-primary">Sign in with Google</a>
        </li>
      </ul>

      <a href="/auth/login" class="btn btn-primary nav-cta-desktop">Sign in with Google</a>
    {/if}

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

  .nav-name {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .nav-preview {
    font-size: 0.72em;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.01em;
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

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-user-menu-wrap {
    position: relative;
  }

  .nav-user-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 40px;
    padding: 0.35rem 0.7rem 0.35rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .nav-user-trigger:hover {
    background: var(--color-surface-2);
    border-color: color-mix(in oklch, var(--color-primary) 28%, var(--color-border));
  }

  .nav-user-trigger-mobile {
    width: 100%;
    justify-content: flex-start;
    border-radius: var(--radius-sm);
    min-height: 48px;
    padding: 0.7rem 0.8rem;
  }

  .nav-user-avatar {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 18%, var(--color-surface));
    color: var(--color-primary);
    font-size: 0.82rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .nav-user-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  .nav-user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-user-meta {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .nav-user-caret {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    transition: transform 0.15s;
  }

  .nav-user-caret.open {
    transform: rotate(180deg);
  }

  .nav-user-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 12rem;
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    box-shadow: 0 18px 40px color-mix(in oklch, var(--color-text) 14%, transparent);
    z-index: 120;
  }

  .nav-user-menu-mobile {
    position: static;
    margin-top: 0.4rem;
    width: 100%;
    box-shadow: none;
  }

  .nav-user-menu-form {
    margin: 0;
  }

  .nav-user-menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 40px;
    padding: 0.65rem 0.75rem;
    border-radius: var(--radius-sm);
    color: var(--color-text);
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 500;
    transition: background 0.15s, color 0.15s;
  }

  .nav-user-menu-item:hover {
    background: var(--color-surface-2);
    text-decoration: none;
  }

  .nav-user-menu-item-button {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .nav-links-public {
    justify-content: flex-end;
  }

  .nav-cta-mobile {
    display: none;
  }

  .nav-user-mobile {
    display: none;
    list-style: none;
    width: 100%;
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

    .nav-user-mobile {
      display: block;
      padding: 0.25rem 0 0.5rem;
    }

    .nav-hamburger {
      display: flex;
      margin-left: auto;
    }
  }
</style>
