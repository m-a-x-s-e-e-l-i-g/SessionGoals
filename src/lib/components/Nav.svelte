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

  function closeMobile() {
    mobileOpen = false;
  }

  // Close menus on route change
  $: $page.url.pathname, (mobileOpen = false);
  $: $page.url.pathname, (userMenuOpen = false);
</script>

<nav class="nav">
  <div class="container nav-inner">
    <a href="/" class="nav-brand">
      <span class="nav-name">SessionGoals <span class="nav-preview">[preview]</span></span>
    </a>

    {#if user}
      <ul class="nav-links" aria-label="Main navigation">
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
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="dropdown-backdrop" on:click={closeUserMenu} on:keydown={() => {}}></div>
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
      <ul class="nav-links nav-links-public" aria-label="Public navigation">
        <li><a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>Explore</a></li>
        <li><a href="/lists" class="nav-link" class:active={$page.url.pathname.startsWith('/lists')}>Lists</a></li>
        <li><a href="/people" class="nav-link" class:active={$page.url.pathname.startsWith('/people')}>People</a></li>
        <li><a href="/spots" class="nav-link" class:active={$page.url.pathname.startsWith('/spots')}>Spots</a></li>
      </ul>

      <a href="/auth/login" class="btn btn-primary nav-cta-desktop">Sign in with Google</a>
    {/if}

    <button
      class="nav-hamburger"
      on:click={toggleMobile}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
    >
      <span class="hamburger-icon" class:open={mobileOpen} aria-hidden="true">
        <span class="bar bar-1"></span>
        <span class="bar bar-2"></span>
        <span class="bar bar-3"></span>
      </span>
    </button>
  </div>
</nav>

<!-- Mobile drawer -->
{#if mobileOpen}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="drawer-backdrop" on:click={closeMobile} on:keydown={() => {}}></div>
{/if}

<div class="drawer" class:open={mobileOpen} aria-hidden={!mobileOpen}>
  <div class="drawer-inner">
    {#if user}
      <div class="drawer-user">
        <span class="drawer-avatar" aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>
        <div class="drawer-user-info">
          <span class="drawer-user-name">{accountLabel}</span>
          <span class="drawer-user-meta">{user.email}</span>
        </div>
      </div>

      <div class="drawer-divider"></div>

      <nav aria-label="Mobile navigation">
        <ul class="drawer-links">
          {#each links as link}
            <li>
              <a
                href={link.href}
                class="drawer-link"
                class:active={$page.url.pathname === link.href ||
                  (link.href !== '/' && $page.url.pathname.startsWith(link.href))}
                on:click={closeMobile}
              >
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <div class="drawer-divider"></div>

      <div class="drawer-footer">
        <a href="/goals/new" class="btn btn-primary drawer-cta" on:click={closeMobile}>+ New Goal</a>
        <a href={profileHref} class="drawer-footer-link" on:click={closeMobile}>View profile</a>
        <form method="POST" action="/auth/signout">
          <button type="submit" class="drawer-footer-link drawer-signout">Sign out</button>
        </form>
      </div>
    {:else}
      <nav aria-label="Mobile navigation">
        <ul class="drawer-links">
          <li><a href="/" class="drawer-link" class:active={$page.url.pathname === '/'} on:click={closeMobile}>Explore</a></li>
          <li><a href="/lists" class="drawer-link" class:active={$page.url.pathname.startsWith('/lists')} on:click={closeMobile}>Lists</a></li>
          <li><a href="/people" class="drawer-link" class:active={$page.url.pathname.startsWith('/people')} on:click={closeMobile}>People</a></li>
          <li><a href="/spots" class="drawer-link" class:active={$page.url.pathname.startsWith('/spots')} on:click={closeMobile}>Spots</a></li>
        </ul>
      </nav>

      <div class="drawer-divider"></div>

      <div class="drawer-footer">
        <a href="/auth/login" class="btn btn-primary drawer-cta" on:click={closeMobile}>Sign in with Google</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .nav {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 200;
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
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
    padding: 0.65rem 0.8rem;
    min-height: 44px;
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

  .nav-user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-user-caret {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    transition: transform 0.15s;
  }

  .nav-user-caret.open {
    transform: rotate(180deg);
  }

  .dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
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

  /* Hamburger */
  .nav-hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0.5rem;
    min-height: 44px;
    width: 44px;
    cursor: pointer;
    margin-left: auto;
    flex-shrink: 0;
  }

  .hamburger-icon {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 22px;
    height: 22px;
  }

  .bar {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--color-text);
    border-radius: 2px;
    transition: transform 0.22s ease, opacity 0.22s ease;
    transform-origin: center;
    position: absolute;
    left: 0;
  }

  .bar-1 { top: 3px; }
  .bar-2 { top: 10px; }
  .bar-3 { top: 17px; }

  .hamburger-icon.open .bar-1 {
    transform: translateY(7px) rotate(45deg);
  }
  .hamburger-icon.open .bar-2 {
    opacity: 0;
    transform: scaleX(0);
  }
  .hamburger-icon.open .bar-3 {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* Drawer backdrop */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in oklch, var(--color-text) 40%, transparent);
    z-index: 250;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  /* Drawer panel */
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100dvh;
    width: min(80vw, 300px);
    background: var(--color-surface);
    border-left: 1px solid var(--color-border);
    z-index: 260;
    transform: translateX(100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: -8px 0 32px color-mix(in oklch, var(--color-text) 12%, transparent);
  }

  .drawer.open {
    transform: translateX(0);
  }

  .drawer-inner {
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem;
    gap: 0;
    min-height: 100%;
  }

  .drawer-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem 1rem;
  }

  .drawer-avatar {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: color-mix(in oklch, var(--color-primary) 18%, var(--color-surface));
    color: var(--color-primary);
    font-size: 1rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .drawer-user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .drawer-user-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-user-meta {
    font-size: 0.78rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-divider {
    height: 1px;
    background: var(--color-border);
    margin: 0.5rem 0;
  }

  .drawer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.5rem 0;
  }

  .drawer-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 0.75rem;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
    min-height: 48px;
  }

  .drawer-link:hover,
  .drawer-link.active {
    color: var(--color-text);
    background: var(--color-surface-2);
    text-decoration: none;
  }

  .drawer-link.active {
    font-weight: 600;
  }

  .drawer-footer {
    margin-top: auto;
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .drawer-cta {
    width: 100%;
    justify-content: center;
    text-align: center;
    margin-bottom: 0.25rem;
  }

  .drawer-footer-link {
    display: flex;
    align-items: center;
    padding: 0.65rem 0.75rem;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
    min-height: 44px;
  }

  .drawer-footer-link:hover {
    color: var(--color-text);
    background: var(--color-surface-2);
    text-decoration: none;
  }

  .drawer-signout {
    border: none;
    background: transparent;
    font: inherit;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  /* Desktop: hide hamburger and drawer trigger */
  @media (min-width: 641px) {
    .nav-hamburger {
      display: none !important;
    }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .nav-links {
      display: none;
    }

    .nav-cta-desktop {
      display: none;
    }

    .nav-hamburger {
      display: flex;
    }
  }
</style>
