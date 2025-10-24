export enum OBJS_TYPES {
    Rock        = 0,
    Forest,
    Port,
    Boat,
    Village,
    Datacenter,
    Fortress,
    Apartment,
    PowerPlant
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

// Island terrain classification
enum ISLAND_SIZE { BIG, NORMAL, SMALL }
enum ISLAND_GEOGRAPHY { PLAIN, MOUNTAINOUS, EQUILIBRATED }


import { NoiseFuncs } from "./noise";
const lerp = (x:number, y:number, a:number):number =>  a * (y - x) + x;

const DEFAULT_PALETTE:Array<rgb> = [
    {r: 255, g: 255, b: 255},
    {r: 209, g: 209, b: 209},
    {r: 155, g: 191, b: 145},
    {r: 240, g: 242, b: 160},
    {r: 32, g: 97, b: 140},
    {r: 19, g: 62, b: 135}
];

export class Island {
    _imageSize : number;
    _terrain : Array<Array<number>>;
    _decorations : Array<DecoratedObj>;
    noise = NoiseFuncs();

    constructor(imageSize:number, terrain?:Array<Array<number>>, decorations?:Array<DecoratedObj>)
    {
        this._imageSize = imageSize;
        this._terrain = (terrain == null) ? Array.from({ length: imageSize }, () => new Array(imageSize)) :
            terrain;
        this._decorations = (decorations == null) ? [] : decorations;
    }

    generateBaseTerrain(seed=Math.random(), size=ISLAND_SIZE.NORMAL, geography=ISLAND_GEOGRAPHY.EQUILIBRATED) {
        // This implementation of island terrain generation was based on this site:
        // https://www.redblobgames.com/maps/terrain-from-noise/

        this.noise.seed(seed);
        //REFs: https://www.redblobgames.com/maps/terrain-from-noise/
        let frequency = 5;
        let pow_val = 1.3;
        //let frequency = 5;
        //let pow_val = 1;

        let start_pos_x = 0.4; //Math.random();
        let start_pos_y = 0.9; //Math.random();
        // get base terrain
        for(let y = 0; y < this._imageSize; y++){
            for(let x = 0; x < this._imageSize; x++){
                let nx = (start_pos_x+ x/this._imageSize - 0.5) * frequency; 
                let ny = (start_pos_y+ y/this._imageSize - 0.5) * frequency;

                let e =   0.82 * this.noise.simplex2(1 * nx, 1 * ny)
                        + 0.43 * this.noise.simplex2(2 * nx, 2 * ny)
                        + 0.25 * this.noise.simplex2(4 * nx, 4 * ny)
                        + 0.38 * this.noise.simplex2(8 * nx, 8 * ny)
                        + 0.14 * this.noise.simplex2(16 * nx, 16 * ny);
                        + 0.5 *  this.noise.simplex2(32 * nx, 32 * ny);
                e = e / (0.82+0.43+0.25+0.38+0.14+0.5);
                e = (e / 2) + 0.5 // normalize


                let base_terrain = Math.pow(e,pow_val);

                let d = Math.min(1,0.3+((((2*x/this._imageSize)-1)**2 + (((2*y/this._imageSize)-1)**2))/Math.sqrt(2)));
                //base_terrain = lerp(base_terrain,d,0.65);
                base_terrain = lerp(base_terrain,d,0.5);

                this._terrain[y][x] = base_terrain;
            }
        }
    }

    getBaseTerrain(palette:Array<rgb> = DEFAULT_PALETTE) {
        let returnArr = Array.from({ length: this._imageSize }, () => new Array(this._imageSize));
        let height = 0;
        if(palette.length < 6) throw Error("Palette too small");

        for(let y = 0; y < this._imageSize; y++){
            for(let x = 0; x < this._imageSize; x++){
                height = this._terrain[y][x]
                if(height < 0.2)
                    returnArr[y][x] = palette[0];
                else if(height < 0.35)
                    returnArr[y][x] = palette[1];
                else if(height < 0.5)
                    returnArr[y][x] = palette[2];
                else if(height < 0.55)
                    returnArr[y][x] = palette[3];
                else if(height < 0.65)
                    returnArr[y][x] = palette[4];
                else    
                    returnArr[y][x] = palette[5];
            }
        }
        return returnArr;
    }
    
    getLLMFriendlyTerrain() {
        let returnArr = Array.from({ length: this._imageSize }, () => new Array(this._imageSize));
        let height = 0;
        for(let y = 0; y < this._imageSize; y++){
            for(let x = 0; x < this._imageSize; x++){
                if(height < 0.55)
                    returnArr[y][x] = 2;
                else if(height < 0.65)
                    returnArr[y][x] = 1;
                else    
                    returnArr[y][x] = 0;
            }
        }

        return returnArr;
    }
};