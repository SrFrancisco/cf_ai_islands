import { error, fail, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { islandsRow } from '@project/common/api';

/**
 * api: /new_island {island_name:str}
 * Appends a new island to the database
 */
export const POST: RequestHandler = async ({request,platform}) => {
    const form_data = await request.formData();
    if(!form_data.has('island_name')) 
        return json({ status: 400 });

    const island_name = form_data.get('island_name');

    // for urls is not good to have spaces in the island name
    const safe_island_name:string = island_name!.toString().replace(/\s+/g, "");
    if(!(/^[a-zA-Z0-9]+$/.test(safe_island_name!.toString()))){
        return json({ status: 400, body: "Island names can only have numbers and letters!" });
    }

    const stmt = platform!.env.islands_db.prepare("SELECT COUNT(*) FROM islands WHERE island_name = ?").bind(safe_island_name);
    const returnValue:D1Result<islandsRow> = await stmt.run<islandsRow>();
    if(returnValue.error || returnValue.results.length != 1) 
        throw new Error("Database error or island not found");
    const st = returnValue.results.at(0);
    if(st?.['COUNT(*)'] != 0)
        return json({ status: 400, body: "There is an island with that name!" });

    const create_stmt = platform!.env.islands_db.prepare(
        "INSERT INTO islands VALUES (?,NULL,NULL,?,NULL,NULL);").bind(safe_island_name,Math.floor(Math.random()*100));
    const returnValueCreate = await create_stmt.run<islandsRow>();
    if(returnValueCreate.error)
        throw new Error("Database error, could not create island");

    return redirect(303,"/islands/"+safe_island_name);
}