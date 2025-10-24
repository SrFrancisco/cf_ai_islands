<script>
    import 'bootstrap/dist/css/bootstrap.min.css';
    import 'bootstrap/dist/js/bootstrap.min.js';
</script>

<div style="text-align: center; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">

<div style="">
<h1>Welcome to Islands!</h1>

<div>
    <a class="btn" href="/islands">Create a new Island</a>
</div>
<div>
    <a class="btn">Edit my island</a>
</div>

</div>  
</div>




<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@mdo">New Island</button>

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

