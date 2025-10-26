CREATE TABLE IF NOT EXISTS islands (
    island_name TEXT PRIMARY KEY,
    island_topology TEXT, -- json
    island_decorations TEXT, -- json
    island_profile TEXT,
    stat_used_tokens TEXT
) WITHOUT ROWID;