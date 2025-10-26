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
		float: right;
		background-color: #fff;
		align-self: flex-start; /* pushes to the left */
	}

</style>

<script lang="ts">
    // this code is based on the Svelte+Three.js scaffold (https://github.com/jasonsturges/threejs-sveltekit)
    import { onMount } from 'svelte';
	import { createScene, new_island, new_island_map, new_island_profile } from '$lib/scene';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
    import type { inferenceRequest, inferenceResponse, Prompt } from '@project/common/api';
    import type { ISLAND_PROFILE } from '@project/common';

	let { data }: PageProps = $props();
	if(data.island_data == null)
	{
		alert("There was an error retrieving the data! Check if database is operational or that the island exists.");
		goto("/");
	}

	let chat_mode = $state(false); /** shows the chat box and previous conversation */
	let edit_mode = $state(!data.island_data?.island_topology == null); /** if not in edit mode only shows island name */
	let ai_topology = $state(true); 
	let ai_prompt_text:string = $state("");
	let previous_prompts:Array<Prompt> = $state([]);
	let ai_in_processing = $state(false); /** disable prompt box while inference is running */

	const toggleEditMode = () => {edit_mode = true; console.log("UPDATE");}

	let el:HTMLCanvasElement;
	const seed = data.island_data!.seed == null ? 10 : data.island_data!.seed;
	onMount(() => {
		if(data.island_data!.island_profile == null)
		{	
			console.log("Using default profile!");
			createScene(el,seed);
		} else createScene(el,seed,(JSON.parse(data.island_data!.island_profile) as ISLAND_PROFILE));
	});

	if(data.island_data?.island_profile != null)
		previous_prompts.push({ // insert previously generated profile for context
				role: "assistant",
				content: data.island_data?.island_profile});

	const ai_prompt = async () => {
		ai_in_processing = true;
		chat_mode = true;
		previous_prompts.push({
			role: "user",
			content: ai_prompt_text});
		
		const req:inferenceRequest = {
			island_name: data.slug,
			prompts: previous_prompts,
			generate_topo: ai_topology
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

		const profile = await response.json<inferenceResponse>();
		new_island_profile(profile.profile);

		previous_prompts.push({
			role: "assistant",
			content: JSON.stringify(profile)});

		ai_in_processing = false;
		
	}
</script>

<div id="container" style="display: flex; justify-content: space-between; flex-flow: row wrap;">
<div style="flex: 1; padding: 15px; display: flex; flex-direction: column; {!edit_mode ? 'align-items: center; align-content: center; justify-content: space-around;' : 'align-items: bottom'} ">
	{#if edit_mode}
		<div style="flex: 1;">
			<div style="display: flex; justify-content: space-between; align-items: center;">
				<div>
					<h1 style="margin: 0;">{data.slug} Island</h1>
				</div>
				<a href="/" class="btn btn-primary" aria-label="home"><i class="bi bi-house-door-fill"></i></a>
			</div>
			<hr>
		</div>
		<div style="{chat_mode ? "display:flex; justify-content: space-between; flex-flow: row wrap; align-items: flex-end;" : undefined}">
		{#if !chat_mode}
			<div style="margin-bottom: 20px;">
			</div>
			<h3>AI-Assisted Decoration</h3>
			<p>Enter your desired map changes in the box above for the LLM to modify it.
			</p>
			<p>LLM can change the parameters of the noise function in order to change the island appearance. It can change:</p>
			<ul>
				<li>Global size of the island and its roundness</li>
				<li>Steepness of the mountains and their frequency</li>
				<li>Mean elevation of the island</li>
				<li>Percentage of each biome (mountain, plain, sand, water)</li>
				<li>Percentage of trees in plain biome</li>
			</ul>
			<p>As of right now, the LLM can only change the terrain generation parameters. This means it cannot place objects, such as trees, in a specific position.</p>
			<p>Example prompt: Make the island smaller/bigger/with more mountains/...</p>
		{:else}
			<div style="float: right; list-style-type: none; float: right; width:100%; gap: 10px; list-style: none; padding: 0; margin: 0; width: 100%;
    			max-height: 700px;overflow-y: auto;overflow-x: hidden;display: flex;flex-direction: column;justify-content: flex-end;gap: 10px;padding: 10px;box-sizing: border-box;">
				<div style="list-style-type: none; margin-bottom: 20px; overflow-y: auto;" class="chat">
				{#each previous_prompts as chat_msg,i}
					{#if chat_msg.role == "assistant" && (i != 0 || data.island_data?.island_profile == null)}
						<div class="bot bubble"><div>Done!</div></div>
					{:else if chat_msg.role == "user"}
						<div class="user bubble"><div>{chat_msg.content}</div></div>
					{/if}
				{/each}
				</div>
			</div>
		{/if}
		
		<div class="input-group mb-3">
			{#if ai_in_processing}
				<div style="display: flex; align-items:center; gap: 10px; margin-bottom: 10px; width: 100%;">
					<div class="spinner-border" role="status" >
						<span class="sr-only"></span>
					</div>
					
					<span>Loading, this may take a few seconds...</span>
				</div>
			{/if}
			<textarea class="form-control" placeholder="What would you like to include/modify?" 
				bind:value={ai_prompt_text} disabled="{ai_in_processing}" rows="1" onkeydown={(e) => {if(e.key == 'Enter'){ e.preventDefault(); ai_prompt();}}}></textarea>
			<button disabled="{ai_in_processing}" class="btn btn-primary" type="button" id="button-addon2" onclick="{ai_prompt}">Generate</button>
		</div>
		</div>
	{:else}
		<div style="text-align: center;">
			<h1 style="margin: 0; text-align: center;">{data.slug} Island</h1>
			<button class="btn btn-primary" style="width: 80%; margin-top: 20px;" onclick="{toggleEditMode}">Edit</button>
		</div>
	{/if}


</div>
<canvas bind:this={el}></canvas>
</div>