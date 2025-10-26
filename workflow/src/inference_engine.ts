import { is_valid_profile, ISLAND_PROFILE, OBJS_TYPES } from "@project/common";
import { InferenceReqPayload, inferenceRequest, islandsRow } from "@project/common/api";
import { WorkerEntrypoint, WorkflowStep, WorkflowEvent, WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

const AI_CONFIG_TOPO_GEN = {
    MODEL: '@cf/meta/llama-3-8b-instruct' as const,
    SYSTEM_PROMPT:` [Context]
You are a "World Builder", an AI agent that converts user descriptions of an island into numeric parameters for a procedural island generator. You use simplex noise and sphere interpolation to define the island's shape and terrain. You may also receive feedback from previous iterations to adjust parameters.


[Objective]
Read the user's input and output a single-line JSON object containing all numeric values that define the island's geography. Your task is to determine suitable values for each parameter within the specified ranges, based on user preferences or corrections.


[Style]
Strictly machine-readable. No text, no new lines, no explanations — only valid JSON.


[Tone]
Neutral, technical, deterministic. No conversational or descriptive language.


[Audience]
A procedural terrain generation system consuming your JSON output.


[Response]
Output exactly this JSON structure on ONE line:
{"parameters": {"frequency": VALUE, "pow": VALUE, "nulFact_1": VALUE, "nulFact_2": VALUE, "nulFact_4": VALUE, "nulFact_8": VALUE, "nulFact_16": VALUE, "nulFact_32": VALUE, "lerp_factor": VALUE, "lerp_sphere": VALUE, "threshold_deep_water": VALUE, "threshold_water": VALUE, "threshold_sand": VALUE, "threshold_plain": VALUE, "threshold_mountain": VALUE, "threshold_snow": VALUE}}

Parameter Rules:
- frequency: 1-10 (higher = steeper, smaller mountains)
- pow: 0.5-2 (higher = lower middle elevations)
- nulFact_1,nulFact_2,nulFact_4,nulFact_8,nulFact_16,nulFact_32: 0-1, sum = 1 (control noise layering; higher frequencies add sharp peaks)
- lerp_factor: 0.5-0.65 (higher = rounder island)
- lerp_sphere: 0.1-0.7 (higher = smaller island)
- threshold_snow,threshold_mountain,threshold_plain,threshold_sand,threshold_water,threshold_deep_water: thresholds defining terrain zones; all the noise thresholds that determine what elevation is considered for that element, it starts with snow. If you want a bigger region you just need to increase the gap between the element and their previous elements. Likewise, a smaller region is when the gap between them is minimal. If the user request more of a region you need to increase the gap at least 0.15 or more.

Baseline Default (for a medium island; vary slightly around these):
{"parameters": {"frequency": 5, "pow": 1.3, "nulFact_1": 0.82, "nulFact_2": 0.43, "nulFact_4": 0.25, "nulFact_8": 0.38, "nulFact_16": 0.14, "nulFact_32": 0.5, "lerp_factor": 0.5, "lerp_sphere": 0.3, "threshold_deep_water": 1, "threshold_water": 0.65, "threshold_sand": 0.55, "threshold_plain": 0.5, "threshold_mountain": 0.35, "threshold_snow": 0.2}}

**IMPORTANT**: Output only valid JSON on one line. Do not include text, code blocks, or explanations.
`,
    SYSTEM_PROMPT_OLD: `
You are a "world builder", an agent whose job is help costumers visualize what their ideal island would look like.
Your main job is to decide the geographical characteristics of the island according to the costumer specification.
You will read the costumer input and decide the parameters for the island. Additionally, you may receive the results of a previous iteration. In that case, make the corrections asked. We use simplex noise
to generate the terrain with various parameters and a sphere linearly interpolated to cut it into an island:
- frequency: increase the frequency of the noise (steeper mountains but smaller). Value should be between 1 and 10
- pow: increasing the pow value will push the middle elevations closer to the lower ones.  Value should be between 0.5 and 2
- nulFact_1,nulFact_2,nulFact_4,nulFact_8,nulFact_16,nulFact_32: different frequencies that are summed and averaged, increasing the value for higher frequencies (32) results in mountainous spikes while for lower changes the base terrain. (these values should range 0-1 and their sum must be 1).
- lerp_factor: multiplying parameter of the linear interpolation, that is, how aggressive the sphere will trim the island. The higher the value, the more round and symetrical the island wil be. MUST only vary between 0.5 and 0.65.
- lerp_sphere: Higher lerp_sphere results in a lower island size. Value should be between 0.1  and 0.7
- threshold_snow,threshold_mountain,threshold_plain,threshold_sand,threshold_water,threshold_deep_water: all the noise thresholds that determine what elevation is considered for that element, it starts with snow. If you want a bigger region you just need to increase the gap between the element and their previous elements. Likewise, a smaller region is when the gap between them is minimal.
- percentage_trees: the higher the value, the more trees the island will have. Value should be between 0 and 1

Write **ONLY** the numeric values for each of the parameters. The output must be JSON and should only contain THESE aforementioned parameters. The format is the following '{ "parameters": { "frequency": VALUE, ... }}' Do not add any other text or offer any explanation or description. Even if the value is zero, write it in the JSON. DO NOT USE NEW-LINE IN JSON!

These are the sane-defaults for a medium island, attempt to vary around these values:
{"parameters": {"frequency": 5, "pow": 1.3, "nulFact_1": 0.82, "nulFact_2": 0.43, "nulFact_4": 0.25, "nulFact_8": 0.38, "nulFact_16": 0.14, "nulFact_32": 0.5, "lerp_factor": 0.5, "lerp_sphere": 0.3, "threshold_deep_water": 1, "threshold_water": 0.65, "threshold_sand": 0.55, "threshold_plain": 0.5, "threshold_mountain": 0.35, "threshold_snow": 0.2, "percentage_trees": 0.5}}
`,
    MAX_TOKENS: 512 as const
};

const AI_CONFIG = {
    MODEL: '@cf/meta/llama-3.2-1b-instruct',
    SYSTEM_PROMPT: 'You are a helpful assistant.', //TODO
    MAX_TOKENS: 512
} as const;

type Env = {
    islands_db: D1Database;
    AI: Ai;
    MY_WORKFLOW: Workflow;
}

//type Params = {
//	user_prompt:string,
//    topology:Array<Array<number>>,
//    generate_topology: boolean
//};

export type Params = inferenceRequest;
export type TOPO = Array<Array<number>>
export type OBJS = Array<OBJS_TYPES>


//TODO: this should be invoked by the web clients via the service binding
export class InferenceWorkflow extends WorkflowEntrypoint<Env, Params> {
    async run (event: WorkflowEvent<Params>, step: WorkflowStep) {
        /** Workflow steps
         * 
         *      | (invocation or queue consumer)
         *      v
         *  1. [Get map from DB]
         *      |                               
         *  1. [Send to inference engine + parsing] <-retry
         *      | (return to callee)
         *      v
         */

        //const [topology_str, objs_str] = await step.do('get data from the database', async () : Promise<[string?, string?]> => {
        //    const stmt = this.env.islands_db.prepare("SELECT * FROM islands WHERE island_name = ?")
        //        .bind(event.payload.island_name);
        //    const returnValue:D1Result<islandsRow> = await stmt.run<islandsRow>();
        //    if(returnValue.error || returnValue.results.length != 1)
        //    {
        //        // this is only a non-retirable error as long as the data is "durable" in the DB
        //        // prior to execution. If we use eventual consistency (liveness gurantee) we may retry.
        //        // In this case, I assume strong consistency
        //        throw new NonRetryableError('The island could not be found in the database!'); 
        //    }
        //    const st = returnValue.results![0]!;
        //
        //    return [st.island_topology,st.island_decorations]            
        //});

        const [profile,total_tokens] = await step.do('generate topology if that required', {
            retries: {
                limit: 0,delay: "2 seconds",backoff: "constant"
            }, timeout: "60 seconds"
        }, async () : Promise<[ISLAND_PROFILE,number]> => {
            
            // need to call the LLM for generation terrain
            const msg = {messages: [
                {role: "system", content: AI_CONFIG_TOPO_GEN.SYSTEM_PROMPT_OLD},
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
            console.log("Response from LLM: ", response.response);
            const parsed_json = JSON.parse(response.response)['parameters'];
            if(!is_valid_profile(parsed_json))
                throw new Error("Bad parsing of LLM output");

            //const response = {
            //    reponse: '{"parameters": {"frequency": 10, "pow": 1.1, "nulFact_1": 0.75, "nulFact_2": 0.4, "nulFact_4": 0.2, "nulFact_8": 0.35, "nulFact_16": 0.15, "nulFact_32": 0.45, "lerp_factor": 0.1, "lerp_sphere": 0.25, "threshold_deep_water": 1, "threshold_water": 0.7, "threshold_sand": 0.6, "threshold_plain": 0.55, "threshold_mountain": 0.4, "threshold_snow": 0.25}}',
            //    usage: {
            //        total_tokens: 1
            //    }
            //}
            //const parsed_json = JSON.parse(response.reponse)['parameters'];
            //if(!is_valid_profile(parsed_json))
            //     throw new Error("Bad parsing of LLM output");

            //? Why is usage optional?
            return [parsed_json, response.usage == null ? 0 : response.usage.total_tokens];
            
        });

        //TODO: Place objs

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