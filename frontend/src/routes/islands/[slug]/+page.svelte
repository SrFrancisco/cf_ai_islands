<style>
	:global(body) { margin: 0; padding: 0; } 
	@media only screen and (max-width: 600px) {
		#container{display: block !important;}
		canvas{float: initial !important;}
	}

	.chat {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column; /* ensures vertical stacking */
		gap: 8px; /* space between messages */
	}

	.chat li {
	display: flex; /* allows easy left/right alignment */
	}

	.bubble {
		display: inline-block; /* makes width depend on content */
		padding: 8px 12px;
		border-radius: 16px;
		max-width: 400px;
		word-wrap: anywhere;
	}

	.user {
		background-color: #8accea;
		align-self: flex-end; /* pushes to the right */
	}

	.bot {
		background-color: #fff;
		align-self: flex-start; /* pushes to the left */
	}

</style>

<script lang="ts">
    // this code is based on the Svelte+Three.js scaffold (https://github.com/jasonsturges/threejs-sveltekit)
    import { onMount } from 'svelte';
	import { createScene, new_island, new_island_map } from '$lib/scene';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
    import type { inferenceRequest, inferenceResponse } from '@project/common/api';

	let { data }: PageProps = $props();
	if(data.island_data == null)
	{
		alert("There was an error retrieving the data! Check if database is operational or that the island exists.");
		goto("/");
	}

	let chat_mode = $state(false);
	let edit_mode = $state(!data.island_data?.island_topology == null);
	let ai_topology = $state(true);
	const toggleEditMode = () => {edit_mode = true; console.log("UPDATE");}
	let ai_prompt_text:string = $state("");
	let previous_prompts:Array<string> = $state([]);
	let ai_in_processing = $state(false);

	let el:HTMLCanvasElement;
	onMount(() => {
		createScene(el);
	});


	const ai_prompt = async () => {
		ai_in_processing = true;
		chat_mode = true;
		previous_prompts.push(ai_prompt_text);
		
		const req:inferenceRequest = {
			island_name: data.slug,
			prompt: previous_prompts
		}

		ai_prompt_text = "";
		let response:Response = await fetch("/api/run_inference",{
			method: 'POST',
			headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
			},
			body: JSON.stringify(req)
		});

		if(!response.ok) {
			alert("There was an error with the inference engine! Try again later");
			ai_in_processing = false;
			return;
		}

		const island_data = await response.json<inferenceResponse>();
		new_island_map(island_data.map,island_data.objs);
		ai_in_processing = false;
		
	}
</script>

<div id="container" style="display: flex; justify-content: space-between; flex-flow: row wrap; {chat_mode ? "align-items: flex-end;" : undefined}">
<div style="flex: 1; padding: 15px; {!edit_mode ? 'align-content: center;' : undefined}">
	{#if edit_mode}
		{#if !chat_mode}
			<div style="display: flex; justify-content: space-between; align-items: baseline;">
				<div>
					<h1 style="margin: 0;">Island #1</h1>
				</div>
			</div>
			<hr>
			<div style="margin-bottom: 20px;">
				<h3>Island Topology</h3>
				<p>You can use the button below to generate a new terrain for the island. AI can also do it for you if you enable the option.</p>
				<div class="form-check form-switch" style="margin-bottom: 10px;">
					<input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" onchange={() => {ai_topology = !ai_topology;}} checked>
					<label class="form-check-label" for="switchCheckDefault">Let AI decide the topology based on the prompt.</label>
				</div>
				{#if ai_topology}
					<button type="button" class="btn btn-primary" disabled>New Topology (random)</button>
				{:else}
					<button type="button" class="btn btn-primary" onclick={new_island}>New Topology (random)</button>
				{/if}
			</div>
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
		{:else}
			<div style="float: right; list-style-type: none; float: right; display: flex; gap: 10px; list-style: none; padding: 0; margin: 0;">
				<ul style="list-style-type: none; margin-bottom: 20px;" class="chat">
				{#each previous_prompts as chat_msg}
					<li class="user bubble"><div>{chat_msg}</div></li>
				{/each}
				</ul>
			</div>
		{/if}
		<div class="input-group mb-3">
			<textarea class="form-control" placeholder="What would you like to include?" 
				bind:value={ai_prompt_text} disabled="{ai_in_processing}" rows="1" onkeydown={(e) => {if(e.key == 'Enter'){ e.preventDefault(); ai_prompt();}}}></textarea>
			<button disabled="{ai_in_processing}" class="btn btn-primary" type="button" id="button-addon2" onclick="{ai_prompt}">Generate</button>
		</div>
	{:else}
		<div style="text-align: center;">
			<h1 style="margin: 0; text-align: center;">Island #1</h1>
			<button class="btn btn-primary" style="width: 80%; margin-top: 20px;" onclick="{toggleEditMode}">Edit</button>
		</div>
	{/if}


</div>
<canvas bind:this={el}></canvas>
</div>