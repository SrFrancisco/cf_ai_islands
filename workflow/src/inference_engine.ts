import { is_valid_profile, ISLAND_PROFILE, OBJS_TYPES } from "@project/common";
import { InferenceReqPayload, inferenceRequest, islandsRow } from "@project/common/api";
import { WorkerEntrypoint, WorkflowStep, WorkflowEvent, WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

const AI_CONFIG_TOPO_GEN = {
    MODEL: '@cf/meta/llama-3-8b-instruct' as const,
    SYSTEM_PROMPT: `
You are a "world builder", an agent whose job is help costumers visualize what their ideal island would look like.
Your main job is to decide the geographical characteristics of the island according to the costumer specification.
You will read the costumer input and decide the parameters for the island. Additionally, you may receive the results of a previous iteration. In that case, make the corrections asked. We use simplex noise
to generate the terrain with various parameters and a sphere linearly interpolated to cut it into an island:
- frequency: increase the frequency of the noise (steeper mountains but smaller). Value should be between 1 and 10
- pow: increasing the pow value will push the middle elevations closer to the lower ones.  Value should be between 0.5 and 2
- nulFact_1,nulFact_2,nulFact_4,nulFact_8,nulFact_16,nulFact_32: different frequencies that are summed and averaged, increasing the value for higher frequencies (32) results in mountainous spikes while for lower changes the base terrain. (these values should range 0-1 and their sum must be 1).
- lerp_factor: multiplying parameter of the linear interpolation, that is, how aggressive the sphere will trim the island. The higher the value, the more round and symetrical the island wil be. MUST only vary between 0.5 and 0.65.
- lerp_sphere: Higher lerp_sphere results in a lower island size. Value should be between 0.1  and 0.7
- threshold_snow,threshold_mountain,threshold_plain,threshold_sand,threshold_water,threshold_deep_water: Represents the areas considered for each biome. If the value is positive, the biome with increases its area by that amount. If the value is negative it decreases it. MUST only vary between -0.1 (no biome) and 0.1, if 0 = does not change. 

Write **ONLY** the numeric values for each of the parameters. The output must be JSON and should only contain THESE aforementioned parameters. The format is the following '{ "parameters": { "frequency": VALUE, ... }}' Do not add any other text or offer any explanation or description. Even if the value is zero, write it in the JSON. DO NOT USE NEW-LINE IN JSON!

These are the sane-defaults for a medium island, attempt to vary around these values:
{"parameters": {"frequency": 5, "pow": 1.3, "nulFact_1": 0.82, "nulFact_2": 0.43, "nulFact_4": 0.25, "nulFact_8": 0.38, "nulFact_16": 0.14, "nulFact_32": 0.5, "lerp_factor": 0.5, "lerp_sphere": 0.3, "threshold_deep_water": 0, "threshold_water": 0, "threshold_sand": 0, "threshold_plain": 0, "threshold_mountain": 0, "threshold_snow": 0, "percentage_trees": 0.5}}
`,
    MAX_TOKENS: 512 as const
};

type Env = {
    islands_db: D1Database;
    AI: Ai;
    MY_WORKFLOW: Workflow;
}

export type Params = inferenceRequest;
export type TOPO = Array<Array<number>>
export type OBJS = Array<OBJS_TYPES>


export class InferenceWorkflow extends WorkflowEntrypoint<Env, Params> {
    async run (event: WorkflowEvent<Params>, step: WorkflowStep) {
        /** Workflow steps
         * 
         *      | (invocation or queue consumer)
         *      v
         *  1. [Get map from DB]
         *      |                               
         *  2. [Send to inference engine + parsing] <-retry
         *      | (return to callee)
         *      v
         */

        const [profile,total_tokens] = await step.do('generate topology', {
            retries: {
                limit: 2, delay: "1 seconds",backoff: "constant"
            }, timeout: "60 seconds"
        }, async () : Promise<[ISLAND_PROFILE,number]> => {
            
            // need to call the LLM for generation terrain
            const msg = {messages: [
                {role: "system", content: AI_CONFIG_TOPO_GEN.SYSTEM_PROMPT},
            ], max_tokens: AI_CONFIG_TOPO_GEN.MAX_TOKENS};
            //msg.messages = msg.messages.concat(event.payload.prompts);
            const lastmsg = event.payload.prompts.slice(Math.max(event.payload.prompts.length - 2, 0))
            msg.messages = msg.messages.concat(lastmsg);
            
            // AI call
            console.log("!!! Calling INFERENCE...");
            const response = await this.env.AI.run(AI_CONFIG_TOPO_GEN.MODEL,msg);
            
            // Try parse output
            if(response.response == null)
                throw new Error("failed inference")
            const parsed_json = JSON.parse(response.response)['parameters'];
            if(!is_valid_profile(parsed_json))
                throw new Error("Bad parsing of LLM output");

            //? Why is usage optional?
            return [parsed_json, response.usage == null ? 0 : response.usage.total_tokens];
            
        });

        await step.do('save results in the database', async () : Promise<void> => {
            const stmt = this.env.islands_db.prepare("UPDATE islands SET stat_used_tokens = stat_used_tokens + ? , island_profile = ? WHERE island_name = ? ;")
                .bind(total_tokens,JSON.stringify(profile),event.payload.island_name);
            const returnValue:D1Result = await stmt.run();
            if(returnValue.error)
                throw new NonRetryableError("Database error");
        });
    }

}


//REF: https://developers.cloudflare.com/workflows/build/call-workflows-from-pages/
export default class WorkflowsService extends WorkerEntrypoint<Env> {
    //CF: Currently, entrypoints without a named handler are not supported
    async fetch() { return new Response(null, {status: 404}); }

    async createInstance(payload: inferenceRequest) {
        console.log("Received request with payload ", payload);
        const instace_id = `${payload.island_name}-${await crypto.randomUUID().slice(0, 6)}`;
        let instance = await this.env.MY_WORKFLOW.create({
            id: instace_id,
            params: payload
        });
        
        // Poll for completion
        while(true) {
            const status = await instance.status();
            if (status.status == "complete") {
                return Response.json({
                    id: instance.id,
                    details: status
                });
            }
            if (status.status == 'errored')
                throw new Error("Workflow failed");

            await new Promise((r) => setTimeout(r, 2000));
        }
    }
}