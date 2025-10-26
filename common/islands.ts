import { NoiseFuncs } from "./noise";

const lerp = (x:number, y:number, a:number):number =>  a * (y - x) + x;

/**
 * Objects that can be placed on topo of the terrain
 * NOTE: Some of these objs haven't been implemented in the rendered and are future
 *       work
 */
export enum OBJS_TYPES {
    Rock        = 0,
    Forest,
    Port,
    Boat,
    Village,
    Datacenter,
    Fortress,
    Apartment,
    PowerPlant,
    Mountain
}

export interface rgb {
    r:number; g:number; b:number;
}

export interface DecoratedObj {
    type: OBJS_TYPES; 
    x: number;
    y: number;
    color?: rgb; /** NOTE: only applicable to OBJS that support it */
}

/**
 * Default terrain colors. Each idx corresponds to a biome (ordered)
 */
export const DEFAULT_PALETTE:Array<rgb> = [
    {r: 255, g: 255, b: 255},
    {r: 209, g: 209, b: 209},
    {r:143, g:204, b:88},
    {r: 240, g: 242, b: 160},
    {r: 32, g: 97, b: 140},
    {r: 19, g: 62, b: 135}
];

/**
 * Terrain generator configuration parameters
 */
export type ISLAND_PROFILE = {
    frequency:number,
    pow:number,
    nulFact_1:number,
    nulFact_2:number,
    nulFact_4:number,
    nulFact_8:number,
    nulFact_16:number,
    nulFact_32:number,
    lerp_factor:number,
    lerp_sphere:number,

    // biome limits override (see DEFAULT_TERRAIN for base values)
    // range -1 to 1
    threshold_deep_water:number, 
    threshold_water:number,
    threshold_sand:number,
    threshold_plain:number,
    threshold_mountain:number,
    threshold_snow:number,

    percentage_trees:number /** NOTE: Only placed in 'plane' biome */
};


export function is_valid_profile(obj: any): obj is ISLAND_PROFILE {
    return (
        typeof obj === "object" && obj !== null //&&
            //typeof obj.parameters=== "object"
        &&  typeof obj.frequency === "number"
        &&  typeof obj.pow === "number"
        &&  typeof obj.nulFact_1 === "number"
        &&  typeof obj.nulFact_2 === "number"
        &&  typeof obj.nulFact_4 === "number"
        &&  typeof obj.nulFact_8 === "number"
        &&  typeof obj.nulFact_16 === "number"
        &&  typeof obj.nulFact_32 === "number"
        &&  typeof obj.lerp_factor === "number"
        &&  typeof obj.lerp_sphere === "number"
        &&  typeof obj.threshold_water === "number"
        &&  typeof obj.threshold_sand === "number"
        &&  typeof obj.threshold_plain === "number"
        &&  typeof obj.threshold_mountain === "number"
        &&  typeof obj.threshold_snow === "number"
        &&  typeof obj.percentage_trees === "number"
    );
}


export const DEFAULT_TERRAIN = {
    threshold_deep_water : 1,
    threshold_water      : 0.65,
    threshold_sand       : 0.55,
    threshold_plain      : 0.5,
    threshold_mountain   : 0.35,
    threshold_snow       : 0.2
}

export const DEFAULT_PROFILE:ISLAND_PROFILE = {
    frequency           : 5,
    pow                 : 1.3,
    nulFact_1           : 0.82,
    nulFact_2           : 0.43,
    nulFact_4           : 0.25,
    nulFact_8           : 0.38,
    nulFact_16          : 0.14,
    nulFact_32          : 0.5,
    lerp_factor         : 0.5,
    lerp_sphere         : 0.3,
    threshold_deep_water : 0, /** NOTE: Zero because by default we use DEFAULT_TERRAIN */
    threshold_water      : 0,
    threshold_sand       : 0,
    threshold_plain      : 0,
    threshold_mountain   : 0,
    threshold_snow       : 0,
    percentage_trees     : 0.5
}

export class Island {
    _imageSize : number;
    _terrain : Array<Array<number>>;
    _decorations : Array<DecoratedObj>;
    _profile: ISLAND_PROFILE
    noise = NoiseFuncs();

    constructor(imageSize:number, terrain?:Array<Array<number>>, decorations?:Array<DecoratedObj>)
    {
        this._imageSize = imageSize;
        this._terrain = (terrain == null) ? Array.from({ length: imageSize }, () => new Array(imageSize)) :
            terrain;
        this._decorations = (decorations == null) ? [] : decorations;
        this._profile = DEFAULT_PROFILE;
    }

    set_island_profile(profile:ISLAND_PROFILE) { 
        this._profile = profile; 
    }

    /**
     * This function generates base terrain and places biome objects
     */
    generateBaseTerrain(seed=Math.random(), profile:ISLAND_PROFILE=this._profile) {
        // This implementation of island terrain generation was based on this site:
        // https://www.redblobgames.com/maps/terrain-from-noise/

        this._decorations = [];
        this.noise.seed(seed);
        let frequency = profile.frequency;
        let pow_val = profile.pow;

        let start_pos_x = 0.4; /** Arbitrary */
        let start_pos_y = 0.9;
        // get base terrain
        for(let y = 0; y < this._imageSize; y++){
            for(let x = 0; x < this._imageSize; x++){
                let nx = (start_pos_x+ x/this._imageSize - 0.5) * frequency; 
                let ny = (start_pos_y+ y/this._imageSize - 0.5) * frequency;

                let e =   profile.nulFact_1 * this.noise.simplex2(1 * nx, 1 * ny)
                        + profile.nulFact_2 * this.noise.simplex2(2 * nx, 2 * ny)
                        + profile.nulFact_4 * this.noise.simplex2(4 * nx, 4 * ny)
                        + profile.nulFact_8 * this.noise.simplex2(8 * nx, 8 * ny)
                        + profile.nulFact_16 * this.noise.simplex2(16 * nx, 16 * ny)
                        + profile.nulFact_32 *  this.noise.simplex2(32 * nx, 32 * ny);
                e = e / (profile.nulFact_1+profile.nulFact_2+profile.nulFact_4+profile.nulFact_8
                    +profile.nulFact_16+profile.nulFact_32);
                e = (e / 2) + 0.5 // normalize

                let base_terrain = Math.pow(e,pow_val);

                // Euclidean distance
                let d = Math.min(1,profile.lerp_sphere+((((2*x/this._imageSize)-1)**2 + (((2*y/this._imageSize)-1)**2))/Math.sqrt(2)));

                base_terrain = lerp(base_terrain,d,profile.lerp_factor);

                this._terrain[y][x] = base_terrain;


                const plain = (DEFAULT_TERRAIN.threshold_plain + profile.threshold_snow+ profile.threshold_mountain+ profile.threshold_plain);
                const mountain = (DEFAULT_TERRAIN.threshold_mountain + profile.threshold_snow+ profile.threshold_mountain);

                // check if point belogs to 'plain' biome to place trees
                if(base_terrain < plain && base_terrain >= mountain)
                {
                    // we will calculate tree distribution (another noise function)
                    nx = (start_pos_x+ x/this._imageSize - 0.5) * 7; 
                    ny = (start_pos_y+ y/this._imageSize - 0.5) * 7;
                    e = (this.noise.simplex2(1 * nx, 1 * ny)/2) + 0.5;

                    if(e >= (1-profile.percentage_trees))
                        this._decorations.push({ type:OBJS_TYPES.Forest, x:x, y:y });
                }

                //NOTE: In this implementation we also place 'mountains' as an obj. However, that is not
                //      calculated here because it is not subject to noise (every 'mountain' tile will have a mountain
                //      object). Check frontend/src/lib/scene.ts:204

            }
        }
    }

    /**
     * Retrieve the base map with biomes already applied.
     * Requires the island to be generated prior to this call (generateBaseTerrain)
     */
    getBaseTerrain(palette:Array<rgb> = DEFAULT_PALETTE, profile:ISLAND_PROFILE=this._profile) {
        let returnArr:Array<Array<rgb>> = Array.from({ length: this._imageSize }, () => new Array(this._imageSize));
        let height = 0;
        if(palette.length < 6) throw Error("Palette too small");

        for(let y = 0; y < this._imageSize; y++){
            for(let x = 0; x < this._imageSize; x++){
                height = this._terrain[y][x]
                if(height < (DEFAULT_TERRAIN.threshold_snow 
                                + profile.threshold_snow))
                    returnArr[y][x] = palette[0];
                else if(height < (DEFAULT_TERRAIN.threshold_mountain 
                                + profile.threshold_snow
                                + profile.threshold_mountain))
                    returnArr[y][x] = palette[1];
                else if(height < (DEFAULT_TERRAIN.threshold_plain 
                                + profile.threshold_snow
                                + profile.threshold_mountain
                                + profile.threshold_plain))
                    returnArr[y][x] = palette[2];
                else if(height < (DEFAULT_TERRAIN.threshold_sand 
                                + profile.threshold_snow
                                + profile.threshold_mountain
                                + profile.threshold_plain
                                + profile.threshold_sand))
                    returnArr[y][x] = palette[3];
                else if(height < (DEFAULT_TERRAIN.threshold_water 
                                + profile.threshold_snow
                                + profile.threshold_mountain
                                + profile.threshold_plain
                                + profile.threshold_sand
                                + profile.threshold_water))
                    returnArr[y][x] = palette[4];
                else    
                    returnArr[y][x] = palette[5];
            }
        }

        return returnArr;

    }

};