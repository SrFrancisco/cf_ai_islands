import {NoiseFuncs} from '$lib/noise.js'
import { Color } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { sqrt } from 'three/tsl';

var noise = NoiseFuncs();
export class Island {
    terrain: Array<Array<number>>;
    imageSize: number;
    terrain_color: Array<Array<Color>>;
    terrain_LLM: Array<Array<Number>>;

    constructor(size:number)
    {
        this.imageSize = size;
        this.terrain = Array.from({ length: this.imageSize }, () => new Array(this.imageSize));
        this.terrain_color = Array.from({ length: this.imageSize }, () => new Array(this.imageSize));
        this.terrain_LLM = Array.from({ length: this.imageSize }, () => new Array(this.imageSize));

    }

    /**
     * Adds base terrain using 2D Simplex Noise
     * @param seed used for the simplex noise
     * @param overlayRadius specifies the size of the sphere where simplex noise
     * will be used (rest will be considered ocean)
     */
    generateBaseTerrain(seed:number, overlayRadius:number):void {
        const ridgenoise = (nx:number, ny:number) => {
            return 2 * (0.5 - Math.abs(0.5 - noise.simplex2(nx, ny)));
        };

        noise.seed(Math.random());
        //REFs: https://www.redblobgames.com/maps/terrain-from-noise/
        let frequency = 5;
        let pow_val = 1.3;
        //let frequency = 5;
        //let pow_val = 1;

        let start_pos_x = Math.random();
        let start_pos_y = Math.random();
        // get base terrain
        for(let y = 0; y < this.imageSize; y++){
            for(let x = 0; x < this.imageSize; x++){
                let nx = (start_pos_x+ x/this.imageSize - 0.5) * frequency; 
                let ny = (start_pos_y+ y/this.imageSize - 0.5) * frequency;

                let e =   0.82 * noise.simplex2(1 * nx, 1 * ny)
                        + 0.43 * noise.simplex2(2 * nx, 2 * ny)
                        + 0.25 * noise.simplex2(4 * nx, 4 * ny)
                        + 0.38 * noise.simplex2(8 * nx, 8 * ny)
                        + 0.14 * noise.simplex2(16 * nx, 16 * ny);
                        + 0.5 * noise.simplex2(32 * nx, 32 * ny);
                e = e / (0.82+0.43+0.25+0.38+0.14+0.5);
                e = (e / 2) + 0.5 // normalize


                let base_terrain = Math.pow(e,pow_val);

                let d = Math.min(1,0.3+((((2*x/this.imageSize)-1)**2 + (((2*y/this.imageSize)-1)**2))/Math.sqrt(2)));
                //base_terrain = lerp(base_terrain,d,0.65);
                base_terrain = lerp(base_terrain,d,0.5);

                this.terrain[y][x] = base_terrain;
                this.terrain_color[y][x] = this.colorTerrain(base_terrain);
                this.terrain_LLM[y][x] = this.getLLMFriendlyTerrain(base_terrain);
            }
        }
    }

    colorTerrain(height:number):Color {
        const norm = (col:number) => {return col / 255};
        
        /**
         *if(height < 0.2)
            return new Color(norm(255), norm(255), norm(255));
        else if(height < 0.25)
            return new Color(norm(209), norm(209), norm(209));
        else if(height < 0.4)
            return new Color(norm(155), norm(191), norm(145));
        else if(height < 0.45)
            return new Color(norm(240), norm(242), norm(160));
        else if(height < 0.65)
            return new Color(norm(32), norm(97), norm(140));
        else    
            return new Color(norm(19), norm(62), norm(135));
         */

        if(height < 0.2)
            return new Color(norm(255), norm(255), norm(255));
        else if(height < 0.35)
            return new Color(norm(209), norm(209), norm(209));
        else if(height < 0.5)
            return new Color(norm(155), norm(191), norm(145));
        else if(height < 0.55)
            return new Color(norm(240), norm(242), norm(160));
        else if(height < 0.65)
            return new Color(norm(32), norm(97), norm(140));
        else    
            return new Color(norm(19), norm(62), norm(135));
        
        return new Color(height,height,height); //.setRGB(255,255,255);
    }

    getLLMFriendlyTerrain(height:number):number {
        if(height < 0.55)
            return 2;
        else if(height < 0.65)
            return 1;
        else    
            return 0;
    }

}


export enum OBJS_TYPES {
    Rock        = 0,
    Forest,
    Port,
    Boat,
    Village,
    Datacenter
}


export interface DecoratedObj {
    type: OBJS_TYPES; 
    x: number;
    y: number;
    color: Color; /** NOTE: only applicable to OBJS that support it */
}

