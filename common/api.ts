import { DecoratedObj, ISLAND_PROFILE } from "./islands";

export type InferenceReqPayload = {
    island_uuid: string,
    map: Array<Array<number>>,
    generate_island: boolean
};

export type islandsRow = {
    island_name: string // TEXT PRIMARY KEY
    island_topology: string | undefined // TEXT
    island_decorations: string | undefined // TEXT
    seed: number | undefined // INT
    island_profile: string | undefined // TEXT
    stat_used_tokens: number | undefined // TEXT
    "COUNT(*)":number
};

export type Prompt = {
    role: string,
    content: string
}
export type inferenceRequest = {
    island_name: string,
    prompts: Array<Prompt>,
    generate_topo: boolean
}

export type inferenceResponse = {
    //map:Array<Array<number>>,
    //objs:Array<DecoratedObj>
    profile: ISLAND_PROFILE,
    used_tokens: number
}

export type getIslandsResponse = {
    island_names:Array<string>
}