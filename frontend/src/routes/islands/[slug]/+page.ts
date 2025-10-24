import type { getIslandResponse, islandsRow } from "@project/common/api";
import type { PageLoad } from "../$types";

export const ssr = false; // to allow access for `window` globals
export const prerender = false;

export const load: PageLoad = async ({ params }) => {
    let response:Response = await fetch("/api/get_island?island_name="+params.slug);
	const island_data = await response.json<islandsRow>();
	if(response.ok)
		return {island_data}
	else return {}
};