import * as THREE from 'three';
import { HOSPITAL_MAP } from './hospitalMap3D';

const CELL = 2;
const WALL_H = 3;

function makeTex(color: number, roughness = 0.9): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

export function buildHospital(scene: THREE.Scene) {
  const rows = HOSPITAL_MAP.length;
  const cols = HOSPITAL_MAP[0].length;

  // Shared geometries
  const floorGeo = new THREE.PlaneGeometry(CELL, CELL);
  const wallGeo  = new THREE.BoxGeometry(CELL, WALL_H, 0.15);
  const ceilGeo  = new THREE.PlaneGeometry(CELL, CELL);

  // Materials
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a14 });
  const ceilMat  = new THREE.MeshLambertMaterial({ color: 0x111110 });
  const wallMat  = new THREE.MeshLambertMaterial({ color: 0x1e201a });
  const wallMat2 = new THREE.MeshLambertMaterial({ color: 0x191a16 });
  const doorMat  = new THREE.MeshLambertMaterial({ color: 0x3a2010, transparent: true, opacity: 0.7 });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = HOSPITAL_MAP[r][c];
      const x = c * CELL + CELL / 2;
      const z = r * CELL + CELL / 2;

      if (cell === 0 || cell === 2 || cell === 3) {
        // Floor
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, 0, z);
        floor.receiveShadow = true;
        scene.add(floor);

        // Ceiling
        const ceil = new THREE.Mesh(ceilGeo, ceilMat);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(x, WALL_H, z);
        scene.add(ceil);
      }

      if (cell === 1) {
        // Solid wall block
        const geo = new THREE.BoxGeometry(CELL, WALL_H, CELL);
        const mesh = new THREE.Mesh(geo, (r + c) % 2 === 0 ? wallMat : wallMat2);
        mesh.position.set(x, WALL_H / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      }

      if (cell === 2) {
        // Door frame (open passage with a thin door mesh)
        const doorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(CELL * 0.6, WALL_H * 0.85, 0.1),
          doorMat
        );
        doorMesh.position.set(x, WALL_H * 0.425, z);
        scene.add(doorMesh);
      }
    }
  }

  // Add wall trim / skirting boards
  addDetails(scene, rows, cols);
}

function addDetails(scene: THREE.Scene, rows: number, cols: number) {
  const skirtMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (HOSPITAL_MAP[r][c] === 1) {
        const x = c * 2 + 1;
        const z = r * 2 + 1;
        // Check neighbors and add skirt on floor-side edges
        const neighbors = [
          [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
        ];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && HOSPITAL_MAP[nr][nc] !== 1) {
            const skirt = new THREE.Mesh(
              new THREE.BoxGeometry(2, 0.15, 0.1),
              skirtMat
            );
            const angle = Math.atan2(nc - c, nr - r);
            skirt.rotation.y = angle;
            skirt.position.set(
              (x + nc * 2 + 1) / 2,
              0.075,
              (z + nr * 2 + 1) / 2
            );
            scene.add(skirt);
          }
        }
      }
    }
  }

  // Hospital beds in ward cells
  addBed(scene, 3, 2);
  addBed(scene, 5, 2);
  addBed(scene, 3, 10);
  addBed(scene, 5, 10);

  // Tables/counters
  addTable(scene, 10, 2);
  addTable(scene, 16, 2);
  addTable(scene, 10, 10);
  addTable(scene, 16, 10);
}

function addBed(scene: THREE.Scene, x: number, z: number) {
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const mattressMat = new THREE.MeshLambertMaterial({ color: 0x2a2520 });
  const pillow = new THREE.MeshLambertMaterial({ color: 0x1e1e1e });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 2.0), frameMat);
  frame.position.set(x, 0.4, z);
  scene.add(frame);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 1.85), mattressMat);
  mattress.position.set(x, 0.55, z);
  scene.add(mattress);

  const pillowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.4), pillow);
  pillowMesh.position.set(x, 0.65, z - 0.7);
  scene.add(pillowMesh);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
  for (const [dx, dz] of [[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]]) {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x + dx, 0.2, z + dz);
    scene.add(leg);
  }
}

function addTable(scene: THREE.Scene, x: number, z: number) {
  const mat = new THREE.MeshLambertMaterial({ color: 0x2a2010 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.6), mat);
  top.position.set(x, 0.85, z);
  scene.add(top);

  for (const [dx, dz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), mat);
    leg.position.set(x + dx, 0.425, z + dz);
    scene.add(leg);
  }
}

export function buildLighting(scene: THREE.Scene) {
  // Very dim ambient - horror feel
  const ambient = new THREE.AmbientLight(0x050510, 0.8);
  scene.add(ambient);

  const rows = HOSPITAL_MAP.length;
  const cols = HOSPITAL_MAP[0].length;

  // Flickering fluorescent lights in corridors and rooms
  const lightPositions: [number, number, number][] = [];
  for (let r = 1; r < rows - 1; r += 3) {
    for (let c = 1; c < cols - 1; c += 4) {
      if (HOSPITAL_MAP[r][c] === 0 || HOSPITAL_MAP[r][c] === 2) {
        lightPositions.push([c * 2 + 1, 2.6, r * 2 + 1]);
      }
    }
  }

  const lights: THREE.PointLight[] = [];
  lightPositions.forEach(([x, y, z], i) => {
    const color = i % 4 === 0 ? 0x88cc77 : 0x99bb88; // greenish hospital
    const light = new THREE.PointLight(color, 1.2, 10);
    light.position.set(x, y, z);
    scene.add(light);
    lights.push(light);

    // Visible lamp geometry
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.06, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x999977, emissive: 0x667755, emissiveIntensity: 0.5 })
    );
    lamp.position.set(x, 2.92, z);
    scene.add(lamp);
  });

  // One red emergency light
  const red = new THREE.PointLight(0xff0000, 0.6, 8);
  red.position.set(20, 2.5, 16);
  scene.add(red);

  return lights;
}
