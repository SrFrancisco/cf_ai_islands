export type InferenceReqPayload = {
    island_uuid: string,
    map: Array<Array<number>>,
    generate_island: boolean
};

export type islandsRow = {
    island_name: string // TEXT PRIMARY KEY
    island_topology: string // TEXT
    island_decorations: string // TEXT
    "COUNT(*)":number
};
