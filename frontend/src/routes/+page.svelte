<script lang="ts">
    import 'bootstrap/dist/css/bootstrap.min.css';
    import 'bootstrap/dist/js/bootstrap.min.js';
    import type { PageProps } from './$types';

    let {data} : PageProps = $props();
</script>

<div style="text-align: center; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">

<div style="margin-top: 2em">
<h1>Welcome to Islands!</h1>

<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@mdo">New Island</button>

<div style="margin-top: 30px;">
  <h3>Islands</h3>
  {#if data.islands?.length == 0}
    <span>(🏝️ No island found)</span>
  {/if}

  {#each data.islands as island}

  <div style="display: inline-block; background-color: azure;
  border: 2px solid #56c8ff;
  border-radius: 5px; margin: 5px;">
    
    <a href="/islands/{island}" style="text-decoration: none; color: black; padding: 5px 10px; margin: 5px; ">
      <span style="font-size: 2em;">🏝️</span> {island}</a>
  </div>

  {/each}
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

