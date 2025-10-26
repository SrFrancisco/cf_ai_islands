import { error, fail, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { islandsRow } from '@project/common/api';

export const GET: RequestHandler = (async ({url,request,platform}) => {
    const island_name = url.searchParams.get('island_name');
    if(!(/^[a-zA-Z0-9]+$/.test(island_name!.toString())))
        return json({ status: 400 });

    const stmt = platform!.env.islands_db.prepare("SELECT * FROM islands WHERE island_name = ?").bind(island_name);
    const returnValue:D1Result<islandsRow> = await stmt.run<islandsRow>();
    if(returnValue.error || returnValue.results.length != 1) 
        throw new Error("Database error");
    
    const st = returnValue.results!.at(0)!;
    return json(st,{status: 200})
}) satisfies RequestHandler;