import { error, fail, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { inferenceRequest, inferenceResponse, islandsRow } from '@project/common/api';
import type { ISLAND_PROFILE } from '@project/common';

export const POST: RequestHandler = async ({request,platform}) => {
    const infReq = await request.json<inferenceRequest>();

    if(!(/^[a-zA-Z0-9]+$/.test(infReq.island_name!.toString()))) // sanity check
        return json({ status: 400 });

    let instance = await platform?.env.MY_WORKFLOW.createInstance(infReq);

    // it was written on the database
    const stmt = platform!.env.islands_db.prepare("SELECT * FROM islands WHERE island_name = ?")
        .bind(infReq.island_name);
    const returnValue:D1Result<islandsRow> = await stmt.run<islandsRow>();
    if(returnValue.error || returnValue.results.length != 1) 
        throw new Error();
    const st = returnValue.results!.at(0)!;

    if(st.island_profile == null) throw new Error("Could not find a profile!");

    console.log("CURRENT PROFILE=",st.island_profile);
    const returnBody:inferenceResponse = {
        profile: JSON.parse(st.island_profile!) as ISLAND_PROFILE, // we assume the value exists
        used_tokens: st.stat_used_tokens==null ? 0 : st.stat_used_tokens
    };
    return json(returnBody,{status: 200})

}