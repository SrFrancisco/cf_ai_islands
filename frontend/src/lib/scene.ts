import { Island, OBJS_TYPES, type rgb, type DecoratedObj, type ISLAND_PROFILE, DEFAULT_PROFILE, DEFAULT_PALETTE } from '@project/common';
import * as THREE from 'three'

// CONFIGURATION -------------------
const gridSize = 35;      // number of pixels in X and Y
const pixelSize = 3.4;       // size of each pixel
const aside = true;
const asideRatio = 1.6;

const count = gridSize * gridSize;
// ---------------------------------

const norm = (col:number) => {return col / 255};

// Textures
const loader = new THREE.TextureLoader();

async function loadTexture(url: string) {
  const tex = await loader.loadAsync(url);

  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.premultiplyAlpha = false;
  tex.needsUpdate = true;

  return tex;
}


const textures = { // need the textures loaded prior to rendering

  [OBJS_TYPES.Forest]:      await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Mountain]:    await loadTexture("/img/mountain.png"),

  /** NOTE: These objs aren't yet supported. Defined with placeholder texture */
  [OBJS_TYPES.Port]:        await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Village]:     await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Rock]:        await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Fortress]:    await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Apartment]:   await loadTexture("/img/trees.png"),
  [OBJS_TYPES.PowerPlant]:  await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Boat]:        await loadTexture("/img/trees.png"), 
  [OBJS_TYPES.Datacenter]:  await loadTexture("/img/trees.png")
}

// MAP meshes
let objMeshes = {} as Record<OBJS_TYPES,THREE.InstancedMesh>;
let terrainMesh:THREE.InstancedMesh;


// ---------------------------
//  Camera setup and render
// ---------------------------
let renderer:THREE.WebGLRenderer;
const scene = new THREE.Scene();
scene.background = new THREE.Color(norm(19), norm(62), norm(135));

//REF: https://discourse.threejs.org/t/orthographic-camera-with-limits/49353/3
const frustumSize = 100; // will govern the scale 1 "pixel" to the real size in the canvas
const aspect = !aside ? (window.innerWidth / window.innerHeight) : ((window.innerWidth/asideRatio) / (window.innerHeight))
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.01,
  100
)
camera.position.set(0, 0, 1)


// ---------------------------
//  Main rendering functions
// ---------------------------

/** 
 * @deprecated
 * Renders the map as a collection of "pixels" 
 * */
const render_island_pixels = (colors:Array<Array<THREE.Color>>) => {
  console.log(colors)
  if(colors.length != gridSize) throw Error("array size differs");
  colors.forEach(element => {
    if(element.length != gridSize) throw Error("array size differs");
  });


  const geometry = new THREE.PlaneGeometry(pixelSize,pixelSize);
  let mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff , vertexColors: false}), count);
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  let i = 0;

  for(let y = 0; y < gridSize; y++) {
    for(let x = 0; x < gridSize; x++) {
      dummy.position.set( (x - gridSize/2)* pixelSize, (y - gridSize/2)* pixelSize, 0 );
      dummy.updateMatrix();
      mesh.setMatrixAt( i, dummy.matrix );
      mesh.setColorAt(i,colors[y][x]);
      i++;
    }
  }

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
}

const rgbToColor = (col:rgb) => new THREE.Color().setRGB(col.r/255, col.g/255, col.b/255);

/**
 * Renders the map as a collection of hexagons organized in a bee-like structure
 */
const render_island = (island:Island,profile:ISLAND_PROFILE=DEFAULT_PROFILE) => {
  const radius = pixelSize / 2;
  const dummy = new THREE.Object3D();
  const far = new THREE.Object3D();
  far.position.set(0,0,-2);
  far.updateMatrix();
  const xOffset = Math.sqrt(3) * radius; // horizontal spacing between centers
  const yOffset = 1.5 * radius;          // vertical spacing between centers
  let i = 0;

  let terrain_color = island.getBaseTerrain(DEFAULT_PALETTE,profile);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // center the whole grid around origin
      const xCenterOffset = (gridSize - 1) * xOffset / 2;
      const yCenterOffset = (gridSize - 1) * yOffset / 2;

      const xPos = x * xOffset - xCenterOffset + (y % 2 === 1 ? xOffset / 2 : 0);
      const yPos = y * yOffset - yCenterOffset;

      let color_override:null|THREE.Color = null;

      dummy.position.set(xPos, yPos, 0);
      dummy.rotation.set(0, 0, 0);

      dummy.updateMatrix();

      // check if any objs need to be placed in this position
      let found = false;
      const objs = island._decorations;
      for (const [_, value] of Object.entries(objMeshes)){
        value.setMatrixAt(i, far.matrix);
        value.instanceMatrix.needsUpdate = true
      }

      for(let j = 0; j < objs.length; j++) {
        if((objs[j].y*gridSize + objs[j].x) == i) {
          found = true;

          // set scale for big objs
          if(objs[j].type == OBJS_TYPES.Fortress){
            dummy.renderOrder = i;
            dummy.scale.set(2, 2, 1);
          }
          if(   objs[j].type == OBJS_TYPES.Apartment 
             || objs[j].type == OBJS_TYPES.PowerPlant
             || objs[j].type == OBJS_TYPES.Datacenter
          ){  
            dummy.renderOrder = x;
            dummy.scale.set(1.5,1.5,1);
          }

          dummy.updateMatrix();
          objMeshes[objs[j].type].setMatrixAt(i, dummy.matrix);

          if(objs[j].type == OBJS_TYPES.Forest) {
            dummy.scale.set(1,1,1);
            const tile_color = (objs[j].color != null) ? rgbToColor(objs[j].color!) : new THREE.Color().setHex(0x7bb04b);

            objMeshes[objs[j].type].setColorAt(i, tile_color);
            objMeshes[OBJS_TYPES.Forest].setMatrixAt(i, dummy.matrix);

            color_override=tile_color.offsetHSL(0.0,0.0,0.1); // the forest obj influences 
                                                              // the color of the underlying tile 

            objMeshes[objs[j].type].instanceMatrix.needsUpdate = true
          }

        }
      }

      dummy.renderOrder = 0;
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      terrainMesh.setMatrixAt(i, dummy.matrix);

      // places underlying tile
      if(color_override == null)
        terrainMesh.setColorAt(i, rgbToColor(terrain_color[y][x]));
      else {
        terrainMesh.setColorAt(i, color_override);
        color_override = null;
      }

      // special case: mountain. Will place the texture in every tile of the biome
      if(   rgbToColor(terrain_color[y][x]).getHexString() == rgbToColor({r: 209, g: 209, b: 209}).getHexString()
         || rgbToColor(terrain_color[y][x]).getHexString() == rgbToColor({r: 254, g: 254, b: 254}).getHexString()){
            objMeshes[OBJS_TYPES.Mountain].setMatrixAt(i, dummy.matrix);
            objMeshes[OBJS_TYPES.Mountain].instanceMatrix.needsUpdate = true
            terrainMesh.setColorAt(i, new THREE.Color().setHex(0xbbc7c6));
      }

      i++;
    }
  }

  if (terrainMesh.instanceColor) terrainMesh.instanceColor.needsUpdate = true;
  for (const [_, value] of Object.entries(objMeshes))
    if (value.instanceColor) value.instanceColor.needsUpdate = true;
  console.log("DONE")
};

/**
 * Generate the graphical primitives to render the map (hexagons, textures)
 * THIS FUNCTION SHOULD ONLY BE RUN ONCE. (it adds the meshes to the scene)
 */
const setup_island = (island:Island,profile:ISLAND_PROFILE=DEFAULT_PROFILE) => {
  function createPointyHexGeometry(r = 1) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = i * (Math.PI / 3); // 0,60,120... (pointy top)
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }

  const radius = pixelSize / 2;
  const geometry = createPointyHexGeometry(radius);
  geometry.rotateZ(Math.PI / 6);

  // Texture tile initialization. These will be placed on top of the basic map
  // tiles to display an obj
  Object.keys(textures).forEach((key:string) => {
    const textVal = Number(key) as OBJS_TYPES;
    const material = new THREE.MeshBasicMaterial({
      map: textures[textVal],
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false
    });
    material.map!.repeat.set(0.3, 0.3);
    material.map!.wrapS = material.map!.wrapT = THREE.RepeatWrapping;
    material.map!.center.set(0.5, 0.65);
    material.map!.rotation = -Math.PI / 6; // keep upright
    objMeshes[textVal] = new THREE.InstancedMesh(geometry,material,count);
    scene.add(objMeshes[textVal]);
  });

  // basic tile (colored)
  const material = new THREE.MeshBasicMaterial({ vertexColors: false, side: THREE.DoubleSide, transparent: false,  toneMapped: false });
  terrainMesh = new THREE.InstancedMesh(geometry, material, count);
  scene.add(terrainMesh);

  render_island(island,profile);
};


// STATE -----------------
let island:Island;
// -----------------------

const update = () => {};

const animate = () => {
  // there is no need to keep refreshing the scene as the image is static, we
  // call render manually

	renderer.render(scene, camera);
};

const resize = () => {
	const aspect = (!aside || window.innerWidth < 600) ? (window.innerWidth / window.innerHeight) : ((window.innerWidth/asideRatio) / (window.innerHeight))

    if (aspect >= 1) {
        // Wide window: extend width
        camera.left = (-frustumSize * aspect) / 2;
        camera.right = (frustumSize * aspect) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
    } else {
        // Tall window: extend height
        camera.left = -frustumSize / 2;
        camera.right = frustumSize / 2;
        camera.top = (frustumSize / aspect) / 2;
        camera.bottom = -(frustumSize / aspect) / 2;
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.updateProjectionMatrix();
    if(!aside || window.innerWidth < 600)
      renderer.setSize(window.innerWidth, window.innerHeight);
    else renderer.setSize(window.innerWidth/asideRatio, window.innerHeight);

    animate();
};

export const createScene = (el:HTMLCanvasElement,seed:number=10,profile:ISLAND_PROFILE=DEFAULT_PROFILE) => {
	renderer = new THREE.WebGLRenderer({ antialias: false, canvas: el });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.sortObjects = false;
  //renderer.setSize(window.innerWidth, window.innerHeight);

  island = new Island(gridSize);
  island.generateBaseTerrain(seed,profile);
  setup_island(island,profile);

  if(aside) el.setAttribute('style', 'float: right;');
	resize();
	animate();
};

export const new_island = () => {
  island = new Island(gridSize);
  island.generateBaseTerrain();
  render_island(island);
  animate();
};

export const new_island_map = (topo:Array<Array<number>>, objs:Array<DecoratedObj>) => {
  island = new Island(gridSize,topo,objs);
  island.generateBaseTerrain();
  render_island(island);
  animate();
};

export const new_island_profile = (profile:ISLAND_PROFILE) => {
  console.log("new_island_profile",profile);
  island.set_island_profile(profile);
  island.generateBaseTerrain(10, profile);
  render_island(island,profile);
  animate();
};

window.addEventListener('resize', resize);

