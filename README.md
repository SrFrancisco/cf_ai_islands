# IslandsML
Use LLMs to procedurally-generate islands with natural language.


## Concept
This project explores the idea of using AI for world building. Specifically, it allows a user to specify the characteristics of an island and attempts to change the parameters of a noise-based procedural terrain generator.

Users can create new islands and customize its appearance by prompting an LLM. The LLM receives a description of each available parameter and its effect on the island (noise frequency, biome delimiters, ...) along with a prompt. It then generates a set of configurations that modifies the noise functions according to the request. Finally, the configuration is passed to a terrain generator for rendering, allowing the user to see the results and request further modifications.

The terrain generator uses Simplex Noise and it is based on the Red Blob Games' article about map generation (https://www.redblobgames.com/maps/terrain-from-noise/).

## Architecture and Implementation
This project is divided into three components:

1. **Frontend**: Uses SvelteKit for the UI and Three.js for island rendering. Deployed on Cloudflare Pages.
2. **Inference Engine**: A durable workflow that receives user prompts, processes them with an LLM, and returns configuration results to the frontend. It runs on Cloudflare Workflows and uses Workers AI with the llama-3-8b-instruct model.
3. **Database**: A relational database that stores all islands. It uses Cloudflare D1.

## Setup

0. Run `npm i` at the root of the directory to install all the packages

### Deployment

1. Create the database and apply the schema with:
    ```
    npx wrangler@latest d1 create islands-db --location weur --update-config --binding islands_db

    npx wrangler d1 execute islands-db --remote --file=./db_schema.sql
    ```
    Copy the binding name provided, it should look like this:
    ```
    "d1_databases": [
		{
			"binding": "islands_db",
			"database_name": "islands-db",
			"database_id": "xxxxxxxxx",
		}
	]
    ```
2. Copy the contents of `wrangler.sample.jsonc` to `wrangler.jsonc` in both the `frontend/` and `workflow/` folder.

3. Place the database binding at the end of each file

4. In the `workflow/` folder, deploy the workflow with:
    ```
    npx wrangler deploy
    ```

5. In the `frontend/` folder, deploy the UI with:
    ```
    npx wrangler pages deploy --project-name islandsai
    ```

6. You should see the project deployed at the address provided by the last command

### Local development

> [!NOTE]
> AI inference always uses cloud services even in local dev

Follow steps 1. to 3. of the Deployment.

4. Create a local db instance with

    ```
    # either worklow/ or frontend/
    npx wrangler d1 execute islands-db --local --file=../db_schema.sql --persist-to ../db
    ```

5. Run workflow locally

    ```
    # in worklow/
    npx wrangler dev
    ```

6. Run the web app locally

    ```
    # in frontend/
    # <BINDING> = database_id pasted in the config file
    npm run build && npx wrangler pages dev --d1 islands_db=<BINDING> --persist-to ../db  
    ```



## Screenshots

![](./docs/island_edit.png)

![](./docs/inference.png)