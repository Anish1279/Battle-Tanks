import fs from 'fs';
import { GLTFLoader } from 'node-three-gltf';
import * as THREE from 'three';

const loader = new GLTFLoader();
const data = fs.readFileSync('public/terrain.glb');
loader.parse(data, '', (gltf) => {
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log(`Size: ${size.x}, ${size.y}, ${size.z}`);
  console.log(`Min: ${box.min.x}, ${box.min.y}, ${box.min.z}`);
  console.log(`Max: ${box.max.x}, ${box.max.y}, ${box.max.z}`);
}, (err) => console.error(err));
