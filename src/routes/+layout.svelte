<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
</script>

<a href="#main-content" class="skip-link">Skip to content</a>
<Nav />
<main id="main-content">
  <slot />
</main>
