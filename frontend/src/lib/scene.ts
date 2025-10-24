import { Island, OBJS_TYPES, type rgb, type DecoratedObj } from '@project/common';
import * as THREE from 'three'

// CONFIGURATION -------------------
//const gridSize = 200;      // number of pixels in X and Y
//const pixelSize = 0.5;       // size of each pixel

//const gridSize = 50;      // number of pixels in X and Y
//const pixelSize = 2.5;       // size of each pixel

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
  tex.generateMipmaps = false;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.premultiplyAlpha = false;
  tex.needsUpdate = true;

  return tex;
}


const textures = {
  [OBJS_TYPES.Boat]:        await loadTexture("/img/Sprite-0005.png"), // need the textures loaded prior to rendering
  [OBJS_TYPES.Datacenter]:  await loadTexture("/img/datacenter.png"),
  [OBJS_TYPES.Forest]:      await loadTexture("/img/trees.png"),
  [OBJS_TYPES.Port]:        await loadTexture("/img/Sprite-0005.png"),
  [OBJS_TYPES.Village]:     await loadTexture("/img/Sprite-0005.png"),
  [OBJS_TYPES.Rock]:        await loadTexture("/img/Sprite-0005.png"),
  [OBJS_TYPES.Fortress]:    await loadTexture("/img/castle-1.png"),
  [OBJS_TYPES.Apartment]:   await loadTexture("/img/appartment.png"),
  [OBJS_TYPES.PowerPlant]:   await loadTexture("/img/powerPlant.png"),
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

const render_island_pixels = (colors:Array<Array<THREE.Color>>) => {
  // Precondition: colors array must have the 
  //TODO: There must be a better way to handle errors
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
      //const color = new THREE.Color(colors[y][x],colors[y][x],colors[y][x]);
      //const color = new THREE.Color(colors[y][x],colors[y][x],colors[y][x]);
      //const color = new THREE.Color(Math.random(), Math.random(), Math.random());
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

const render_island = (island:Island) => {
  const radius = pixelSize / 2;
  const dummy = new THREE.Object3D();
  const far = new THREE.Object3D();
  far.position.set(0,0,-2);
  far.updateMatrix();
  const xOffset = Math.sqrt(3) * radius; // horizontal spacing between centers
  const yOffset = 1.5 * radius;          // vertical spacing between centers
  let i = 0;

  let terrain_color = island.getBaseTerrain();


  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // center the whole grid around origin
      const xCenterOffset = (gridSize - 1) * xOffset / 2;
      const yCenterOffset = (gridSize - 1) * yOffset / 2;

      const xPos = x * xOffset - xCenterOffset + (y % 2 === 1 ? xOffset / 2 : 0);
      const yPos = y * yOffset - yCenterOffset;

      

      dummy.position.set(xPos, yPos, 0);
      //dummy.rotation.set(0, 0, 0.5222);
      dummy.rotation.set(0, 0, 0);

      dummy.updateMatrix();

      //TODO: O^4 need to optimize this
      let found = false;
      const objs = island._decorations;
      for (const [_, value] of Object.entries(objMeshes)){
        value.setMatrixAt(i, far.matrix);
        value.instanceMatrix.needsUpdate = true
      }

      for(let j = 0; j < objs.length; j++) {
        if((objs[j].y*gridSize + objs[j].x) == i) {
          found = true;
          console.log("Will place obj at ", i, " in ", objs[j].type);
          if(objs[j].type == OBJS_TYPES.Fortress){
            dummy.renderOrder = i;
            dummy.scale.set(2, 2, 1);
          }
          if(objs[j].type == OBJS_TYPES.Apartment || objs[j].type == OBJS_TYPES.PowerPlant
             || objs[j].type == OBJS_TYPES.Datacenter
          ){  
            dummy.renderOrder = x;
            dummy.scale.set(1.5,1.5,1);
          }
          dummy.updateMatrix();
          objMeshes[objs[j].type].setMatrixAt(i, dummy.matrix);

          if(objs[j].type == OBJS_TYPES.Forest) {
            //let a = new THREE.Color().setHSL(0.3,0.5,0.5);
            objMeshes[objs[j].type].setColorAt(i, (objs[j].color != null) ? rgbToColor(objs[j].color!) : new THREE.Color(norm(240), norm(139), norm(231)));
          }


          //objMeshes[objs[j].type].setColorAt(i, new THREE.Color(0,1,0));
          //objMeshes[objs[j].type].instanceMatrix.needsUpdate = true;
          //objMeshes[objs[j].type].setColorAt(i, island.terrain_color[y][x]);
        }
      }
      dummy.renderOrder = 0;
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      terrainMesh.setMatrixAt(i, dummy.matrix);
      terrainMesh.setColorAt(i, rgbToColor(terrain_color[y][x]));
      //console.log(island.terrain_color[y][x].getHexString())
      if(rgbToColor(terrain_color[y][x]).getHexString() == "cde0c7"){
            objMeshes[OBJS_TYPES.Forest].setColorAt(i,new THREE.Color().setHex(0x7bb04b));
            objMeshes[OBJS_TYPES.Forest].setMatrixAt(i, dummy.matrix);
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
 * THIS FUNCTION SHOULD ONLY BE RUN ONCE. (it adds the meshes to the scene)
 * @param Island 
 * @returns 
 */
const setup_island = (island:Island) => {
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

  
  Object.keys(textures).forEach((key:string) => {
    //const textVal:OBJS_TYPES = +key;
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
    //instanceMeshes[textVal].translateX(-((gridSize+1)*(pixelSize/2)));
    scene.add(objMeshes[textVal]);
  });
  const material = new THREE.MeshBasicMaterial({ vertexColors: false, side: THREE.DoubleSide, transparent: false,  toneMapped: false });
  terrainMesh = new THREE.InstancedMesh(geometry, material, count);
  scene.add(terrainMesh);

  render_island(island);
};

let island:Island;

//const geometry = new THREE.PlaneGeometry(pixelSize,pixelSize);
//let mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff , vertexColors: false}), count);
//scene.add(mesh);
//
//const dummy = new THREE.Object3D();
//let i = 0;
//
//for(let y = 0; y < gridSize; y++) {
//	for(let x = 0; x < gridSize; x++) {
//		dummy.position.set( (x - gridSize/2)* pixelSize, (y - gridSize/2)* pixelSize, 0 );
//		const color = new THREE.Color(Math.random(), Math.random(), Math.random());
//		dummy.updateMatrix();
//		mesh.setMatrixAt( i, dummy.matrix );
//		mesh.setColorAt(i,color);
//		i++;
//	}
//}
//
//if (mesh.instanceColor) {
//	mesh.instanceColor.needsUpdate = true;
//}

//const placeObjs = (objs:Array<DecoratedObj>) => {
//  objs.forEach((element:DecoratedObj) => {
//    //REF: https://github.com/mrdoob/three.js/issues/22102#issuecomment-1207288786
//    const emptyMatrix = new THREE.Matrix4();
//    const baseMatrix = new THREE.Matrix4();
//    let i = element.y*gridSize + element.x;
//    mesh.getMatrixAt(i,baseMatrix);
//    mesh.setMatrixAt(i, emptyMatrix); // set base matrix to zero
//    instanceMeshes[element.type].setMatrixAt(i,baseMatrix);
//    instanceMeshes[element.type].setColorAt(i,new THREE.Color(Math.random(),Math.random(),Math.random()));
//
//    mesh.instanceMatrix.needsUpdate = true;
//    instanceMeshes[element.type].instanceMatrix.needsUpdate = true;
//  })
//}

//placeObjs([{type: OBJS_TYPES.Datacenter, x: 10, y:10}]);



const update = () => {
  //for(let i = 0; i < gridSize*gridSize; i++){
  //  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  //  mesh.setColorAt(i,color);
  //}
  //if (mesh.instanceColor) {
  //  mesh.instanceColor.needsUpdate = true;
  //}
};


const animate = () => {
	//requestAnimationFrame(animate);
  //update();
  //mesh.rotation.z += 0.002;
  //Object.keys(textures).forEach((key:string) => {
  //  //const textVal:OBJS_TYPES = +key;
  //  const textVal = Number(key) as OBJS_TYPES;
  //  renderer.initTexture(textures[textVal]);
  //});
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

export const createScene = (el:HTMLCanvasElement) => {
	renderer = new THREE.WebGLRenderer({ antialias: false, canvas: el });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.sortObjects = false;
  //renderer.setSize(window.innerWidth, window.innerHeight);

  island = new Island(gridSize);
  island.generateBaseTerrain();
  setup_island(island);

  if(aside) el.setAttribute('style', 'float: right;');
	resize();
	animate();
};

export const new_island = () => {
  island = new Island(gridSize);
  island.generateBaseTerrain();
  render_island(island);
  animate();
}

window.addEventListener('resize', resize);

