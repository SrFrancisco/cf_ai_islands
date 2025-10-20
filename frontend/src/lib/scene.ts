import { Island, OBJS_TYPES, type DecoratedObj } from './island';
import * as THREE from 'three'
import { error } from '@sveltejs/kit';

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

const loader = new THREE.TextureLoader();
const textures = {
  [OBJS_TYPES.Boat]: loader.load("/img/house.png"),
  [OBJS_TYPES.Datacenter]: loader.load("/img/house.png"),
  [OBJS_TYPES.Forest]: loader.load("/img/house.png"),
  [OBJS_TYPES.Port]: loader.load("/img/house.png"),
  [OBJS_TYPES.Village]: loader.load("/img/house.png"),
  [OBJS_TYPES.Rock]: loader.load("/img/house.png"),
}

let island = new Island(gridSize);
island.generateBaseTerrain(10,10);

const scene = new THREE.Scene();
const norm = (col:number) => {return col / 255};
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
const render_island = (colors:Array<Array<THREE.Color>>) => {
  // === HELPER: CREATE HEX GEOMETRY ===
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
  
  const material = new THREE.MeshBasicMaterial({ vertexColors: false, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  const xOffset = Math.sqrt(3) * radius; // horizontal spacing between centers
  const yOffset = 1.5 * radius;          // vertical spacing between centers
  let i = 0;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // center the whole grid around origin
      const xCenterOffset = (gridSize - 1) * xOffset / 2;
      const yCenterOffset = (gridSize - 1) * yOffset / 2;

      const xPos = x * xOffset - xCenterOffset + (y % 2 === 1 ? xOffset / 2 : 0);
      const yPos = y * yOffset - yCenterOffset;

      dummy.position.set(xPos, yPos, 0);
      dummy.rotation.set(0, 0, 0.5222);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colors[y][x]);
      i++;
    }
  }

  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  return mesh;
};


const mesh = render_island(island.terrain_color);


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

const placeObjs = (objs:Array<DecoratedObj>) => {
  objs.forEach((element:DecoratedObj) => {
    //TODO: InstaceMesh for tile type ?
  })
}

let renderer:THREE.WebGLRenderer;

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

    camera.updateProjectionMatrix();
    if(!aside || window.innerWidth < 600)
      renderer.setSize(window.innerWidth, window.innerHeight);
    else renderer.setSize(window.innerWidth/asideRatio, window.innerHeight);

    animate();
};

export const createScene = (el:HTMLCanvasElement) => {
	renderer = new THREE.WebGLRenderer({ antialias: false, canvas: el });
  if(aside) el.setAttribute('style', 'float: right;');
	resize();
	animate();
};

export const new_island = () => {
  island = new Island(gridSize);
  island.generateBaseTerrain(10,10);
  render_island(island.terrain_color);
  animate();
}

window.addEventListener('resize', resize);

