<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	
	import 'bootstrap/dist/css/bootstrap.min.css';
	import "bootstrap-icons/font/bootstrap-icons.css";
</script>

<svelte:head>
	<!---<link rel="icon" href={favicon} />-->
</svelte:head>

{@render children?.()}
