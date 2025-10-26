<script lang="ts">
	let { children } = $props();
	
	import 'bootstrap/dist/css/bootstrap.min.css';
	import "bootstrap-icons/font/bootstrap-icons.css";
</script>

<svelte:head>
	<!---<link rel="icon" href={favicon} />-->
</svelte:head>

{@render children?.()}
