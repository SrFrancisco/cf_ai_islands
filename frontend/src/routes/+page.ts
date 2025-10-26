import type { getIslandsResponse } from "@project/common/api";
import type { PageLoad } from "./$types";

export const ssr = false; // to allow access for `window` globals
export const prerender = true;

export const load: PageLoad = async () => {
    let response:Response = await fetch("/api/get_island_list");
    const island_data = await response.json<getIslandsResponse>();
    console.log(island_data.island_names)
    if(response.ok)
        return {islands: island_data.island_names};
    else return {};
};