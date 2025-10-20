<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	
	import 'bootstrap/dist/css/bootstrap.min.css';
  	import 'bootstrap/dist/js/bootstrap.bundle.min.js';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
