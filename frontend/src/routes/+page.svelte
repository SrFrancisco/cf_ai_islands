<script lang="ts">
    import 'bootstrap/dist/css/bootstrap.min.css';
    import 'bootstrap/dist/js/bootstrap.min.js';
    import type { PageProps } from './$types';

    let {data} : PageProps = $props();
</script>

<style>
  .island_card:active {
    box-shadow: none !important;
    position: relative;
    top: 5px;
    left:5px;
    transition: 300ms;
  }
</style>

<div style="display: flex">

<div style="text-align: center; align-items: center; justify-content: center; width: 100%; height: 100%; float: left;">

<div style="margin-top: 2em">
<h1>IslandsML</h1>
<p>Use LLMs to procedurally-generate islands with natural language</p>

<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@mdo">New Island</button>

<div style="margin-top: 30px;">
  <div style="padding-top: 15px; padding-bottom: 15px; background-color: #c1eeff; margin-bottom: 15px;">
    <h3 style="margin: 0; padding: 0;">Created Islands</h3>
  </div>
  <div class="container">
    {#if data.islands?.length == 0}
      <span>(🏝️ No island found)</span>
    {/if}
    <div style="display: flex; flex-direction: row; gap: 15px; justify-content: space-evenly; flex-wrap: wrap;">
      {#each data.islands as island}
        <a href="/islands/{island}" class="card island_card" style="border: 2px solid #0d6efd; text-decoration: none; display: flex; flex-direction: row; box-shadow: 5px 5px #69a5ff;">
          <div class="card-img-top" style="background-color: #c1eeff; border-right: 2px solid  #0d6efd; font-size: 2.5em; flex: 1; border-radius: 5px 0 0 5px;"><span>🏝️</span></div>
          <div class="card-body" style="flex: 2">
            <span class="card-title" style="font-size: 1.3em;">{island}</span>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>


</div>
</div>

</div>


<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="exampleModalLabel">New Island</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form method="post" action="/api/new_island">
          <div class="mb-3">
            <label for="island_name" class="col-form-label">Island name:</label>
            <input type="text" class="form-control" name="island_name">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <input type="submit" class="btn btn-primary" value="Create" >
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

