import { error, fail, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { getIslandsResponse, islandsRow } from '@project/common/api';

export const GET: RequestHandler = (async ({url,request,platform}) => {
    const stmt = platform!.env.islands_db.prepare("SELECT * FROM islands;");
    const returnValue:D1Result<islandsRow> = await stmt.run<islandsRow>();

    if(returnValue.error) throw new Error("Bad DB connection");

    let response:getIslandsResponse = {
        island_names: []
    };
    console.log("RESULTS:",returnValue.results);
    returnValue.results.forEach((elem:islandsRow) => {
        response.island_names.push(elem.island_name);
    });

    return json(response,{status: 200});
}) satisfies RequestHandler;