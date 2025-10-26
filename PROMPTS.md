> List of prompts used in this project for coding. LLM used: ChatGPT

- I have an OrthographicCamera. I would like it to resize but maintain the aspect ratio every time! This code respects the aspect ratio but in turn allows elements to become out of bounds. CODE: `const resize = () => { const aspect = window.innerWidth / window.innerHeight camera.left = (-data.frustumSize * aspect) / 2 camera.right = (data.frustumSize * aspect) / 2 camera.top = data.frustumSize / 2 camera.bottom = -data.frustumSize / 2 camera.updateProjectionMatrix() renderer.setSize(window.innerWidth, window.innerHeight) };`

- Can i do hexagons instead of big pixels. `const geometry = new THREE.PlaneGeometry(pixelSize,pixelSize); let mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff , vertexColors: false}), count); scene.add(mesh); const dummy = new THREE.Object3D(); let i = 0; for(let y = 0; y < gridSize; y++) { for(let x = 0; x < gridSize; x++) { dummy.position.set( (x - gridSize/2)* pixelSize, (y - gridSize/2)* pixelSize, 0 ); //const color = new THREE.Color(colors[y][x],colors[y][x],colors[y][x]); //const color = new THREE.Color(colors[y][x],colors[y][x],colors[y][x]); //const color = new THREE.Color(Math.random(), Math.random(), Math.random()); dummy.updateMatrix(); mesh.setMatrixAt( i, dummy.matrix ); mesh.setColorAt(i,colors[y][x]); i++; } } if (mesh.instanceColor) { mesh.instanceColor.needsUpdate = true; }`
    - Could I use material.map!.rotation?
    - how can I scale the texture

- In threejs I have this function: `async function loadTexture(url: string) { const tex = await loader.loadAsync(url); tex.colorSpace = THREE.SRGBColorSpace; // ensures correct sRGB interpretation tex.generateMipmaps = true; // better filtering tex.minFilter = THREE.LinearMipMapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.premultiplyAlpha = false; // only enable if texture has premultiplied alpha tex.needsUpdate = true; return tex; }` I need to make the texture bigger

- `const parsed_json:ISLAND_PROFILE = JSON.parse(response.response);` would this allow casting the json to the type ISLAND_PROFILE?

- Can you generate me a isometric castle for a hex-map game? The castle needs to be very legible as the hex is only 30px
    - Transparent background, fantasy-medieval, vector-style
    - In the same style, make me trees
    - Same style, a mountain
    - remove the yellow tint and make the mountain while or gray, also remove the visible tile at the base