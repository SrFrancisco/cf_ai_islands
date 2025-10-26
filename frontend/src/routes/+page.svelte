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
<div style="display: flex; flex-direction: row; gap: 15px; justify-content: space-evenly;">
  {#each data.islands as island}

  <!--<div style="display: inline-block; background-color: azure;
  border: 2px solid #56c8ff;
  border-radius: 5px; margin: 5px;">
    
    <a href="/islands/{island}" style="text-decoration: none; color: black; padding: 5px 10px; margin: 5px; font-size: 1.5em;">
      <span>🏝️</span> {island}</a>
  </div>-->


<a href="/islands/{island}" class="card" style="border: 2px solid #0d6efd; text-decoration: none; display: flex; flex-direction: row; box-shadow: 5px 5px #69a5ff;">
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

