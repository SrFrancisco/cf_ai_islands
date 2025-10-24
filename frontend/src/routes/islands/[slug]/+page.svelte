<style>
	:global(body) { margin: 0; padding: 0; } 
	@media only screen and (max-width: 600px) {
		#container{display: block !important;}
		canvas{float: initial !important;}
	}
</style>

<script lang="ts">
    // this code is based on the Svelte+Three.js scaffold (https://github.com/jasonsturges/threejs-sveltekit)
    import { onMount } from 'svelte';
	import { createScene, new_island } from '$lib/scene';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	if(data.island_data == null)
	{
		alert("There was an error retrieving the data! Check if database is operational or that the island exists.");
		goto("/");
	}

	console.log(data);
	


	let el:HTMLCanvasElement;
	onMount(() => {
		createScene(el);
	});
</script>

<div id="container" style="display: flex; justify-content: space-between; flex-flow: row wrap;">
<div style="flex: 1; padding: 15px;">
	<div style="display: flex; justify-content: space-between;h">
		<div>
			<h1>Island #1</h1>
			<span>Part of the <a href="#">0x1111</a> archipelagos</span>
		</div>
		<button class="btn btn-danger" style="float: right;" onclick="{new_island}">New base terrain<br>(removes customizations)</button>
	</div>

	
	<hr>
	

	<h3>AI-Assisted Decoration</h3>
	<p>An LLM can decorate the map for you, for this fill the box above with the details.
	</p>
	<b>Elements that the LLM can include:</b>
	<ul>
		<li>Rocks</li>
		<li>Forest (pick the colors)</li>
		<li>Port</li>
		<li>Boats</li>
		<li>Villages</li>
		<li>Datacenter</li>
	</ul>
	<div class="input-group mb-3">
		<input type="text" class="form-control" placeholder="What would you like to include?" aria-label="Recipient’s username" aria-describedby="button-addon2">
		<button class="btn btn-outline-secondary" type="button" id="button-addon2">Generate</button>
	</div>


</div>
<canvas bind:this={el}></canvas>
</div>