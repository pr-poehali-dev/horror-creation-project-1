import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { HOSPITAL_MAP, INTERACTABLES } from '@/lib/hospitalMap3D';
import { buildHospital, buildLighting } from '@/lib/buildHospital';

interface PlayerState {
  id: 1 | 2;
  name: string;
  hp: number;
  sanity: number;
  keys: string[];
  items: string[];
  isAlive: boolean;
}

interface Game3DProps {
  player1Name: string;
  player2Name: string;
  onExit: () => void;
}

const CELL = 2;
const WALL_H = 3;
const PLAYER_H = 1.7;
const MOVE_SPEED = 0.07;
const TURN_SPEED = 0.03;
const INTERACT_DIST = 2.5;
const GRANNY_SPEED = 0.015;

// Collision check - returns true if walkable
function canWalk(x: number, z: number): boolean {
  const col = Math.floor(x / CELL);
  const row = Math.floor(z / CELL);
  if (row < 0 || row >= HOSPITAL_MAP.length || col < 0 || col >= HOSPITAL_MAP[0].length) return false;
  const cell = HOSPITAL_MAP[row][col];
  return cell !== 1;
}

const PUZZLES_DATA: Record<string, {
  title: string;
  type: 'code' | 'options' | 'sequence';
  question: string;
  answer?: string;
  options?: string[];
  correctIdx?: number;
  reward: string;
  rewardKey?: string;
}> = {
  ward1: {
    title: 'Палата 13 — Загадка',
    type: 'code',
    question: 'На стене нацарапано: "Сумма цифр года основания = 27. Год между 1980 и 1995." Введите год:',
    answer: '1989',
    reward: 'Ключ от лаборатории',
    rewardKey: 'key_lab',
  },
  lab: {
    title: 'Лаборатория — Формула',
    type: 'options',
    question: 'Какой элемент используется как антисептик в больницах?',
    options: ['Натрий', 'Йод', 'Калий', 'Хлор'],
    correctIdx: 1,
    reward: 'Ключ от склада',
    rewardKey: 'key_storage',
  },
  storage: {
    title: 'Склад — Инвентаризация',
    type: 'code',
    question: '144 ящика. 1/3 пустые. Из оставшихся — половина просрочена. Сколько годных?',
    answer: '48',
    reward: 'Ключ от Операционной',
    rewardKey: 'key_op',
  },
  ward2: {
    title: 'Палата 6 — Электрощит',
    type: 'options',
    question: 'Какой провод замыкает аварийный контур? Смотрите на схему: Красный→A, Синий→C, Жёлтый→B. Какой подключить первым?',
    options: ['Красный (A)', 'Синий (C)', 'Жёлтый (B)', 'Зелёный (D)'],
    correctIdx: 0,
    reward: 'Аптечка + подсказка',
    rewardKey: undefined,
  },
  reception: {
    title: 'Регистратура — Сейф',
    type: 'code',
    question: 'Код на стене: "19 + 70 = ??" Введите 4 цифры:',
    answer: '1989',
    reward: 'Ключ от аварийного выхода',
    rewardKey: 'key_exit',
  },
  code2: {
    title: 'Операционная — Последний замок',
    type: 'code',
    question: 'Что написано на операционном столе кровью? Введите слово (подсказка: крик о помощи):',
    answer: 'ПОМОЩЬ',
    reward: 'Выход разблокирован!',
    rewardKey: undefined,
  },
};

const Game3D = ({ player1Name, player2Name, onExit }: Game3DProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const yawRef = useRef(0);
  const grannyRef = useRef<THREE.Mesh | null>(null);
  const grannyPosRef = useRef({ x: 20, z: 16 });
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const interactMeshesRef = useRef<{ mesh: THREE.Mesh; id: string }[]>([]);
  const clockRef = useRef(new THREE.Clock());

  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>([
    { id: 1, name: player1Name || 'Игрок 1', hp: 100, sanity: 100, keys: [], items: [], isAlive: true },
    { id: 2, name: player2Name || 'Игрок 2', hp: 100, sanity: 100, keys: [], items: [], isAlive: true },
  ]);
  const playersRef = useRef(players);
  playersRef.current = players;
  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;

  const [nearbyInteractable, setNearbyInteractable] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<string | null>(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState<Set<string>>(new Set());
  const solvedRef = useRef<Set<string>>(new Set());
  const [noise, setNoise] = useState(0);
  const noiseRef = useRef(0);
  const [logs, setLogs] = useState<string[]>(['📖 Вы в больнице. Найдите выход!', '⚠ Грани охотится. Двигайтесь тихо.']);
  const [timeLeft, setTimeLeft] = useState(900);
  const [gameOver, setGameOver] = useState<null | 'death' | 'victory'>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [puzzleFeedback, setPuzzleFeedback] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [unlockedDoors, setUnlockedDoors] = useState<Set<string>>(new Set());
  const unlockedRef = useRef<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const [collecteds, setCollecteds] = useState<Set<string>>(new Set());
  const collectedRef = useRef<Set<string>>(new Set());
  const [grannyAlert, setGrannyAlert] = useState(false);
  const grannyAlertRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-20), msg]);
  }, []);

  // Camera start position (corridor center)
  const camPosRef = useRef({ x: 10 * CELL + 1, z: 6 * CELL + 1 });

  // ---- INIT SCENE ----
  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.12);
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 50);
    camera.position.set(camPosRef.current.x, PLAYER_H, camPosRef.current.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    buildHospital(scene);
    const lights = buildLighting(scene);
    lightsRef.current = lights;

    // Granny mesh
    const grannyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const grannyMat = new THREE.MeshLambertMaterial({ color: 0x3a1a1a });
    const granny = new THREE.Mesh(grannyGeo, grannyMat);
    granny.position.set(grannyPosRef.current.x, 1.0, grannyPosRef.current.z);
    scene.add(granny);
    grannyRef.current = granny;

    // Eyes on granny
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1 });
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    for (const dx of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(grannyPosRef.current.x + dx, 1.7, grannyPosRef.current.z - 0.28);
      scene.add(eye);
    }

    // Interactable objects
    const interactMat = new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0xaa8800, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });
    INTERACTABLES.forEach(obj => {
      if (obj.type === 'door') return;
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mesh = new THREE.Mesh(geo, interactMat.clone());
      mesh.position.set(obj.pos[0], 0.9, obj.pos[2]);
      mesh.userData.interactId = obj.id;
      scene.add(mesh);
      interactMeshesRef.current.push({ mesh, id: obj.id });
    });

    // Resize handler
    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Pointer lock
    const onPLChange = () => {
      setIsPointerLocked(document.pointerLockElement === renderer.domElement);
    };
    document.addEventListener('pointerlockchange', onPLChange);

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      yawRef.current -= e.movementX * 0.002;
    };
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onPLChange);
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ---- GAME LOOP ----
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    let flickerTimer = 0;
    let grannyTimer = 0;
    let nearId: string | null = null;

    const loop = () => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Flicker lights
      flickerTimer += dt;
      if (flickerTimer > 0.08) {
        flickerTimer = 0;
        lightsRef.current.forEach((l, i) => {
          const flicker = Math.sin(elapsed * (3 + i * 0.7)) * 0.15 + (Math.random() < 0.02 ? Math.random() * 0.5 : 0);
          l.intensity = Math.max(0.1, 1.2 - flicker);
        });
      }

      // Rotate interactables
      interactMeshesRef.current.forEach(({ mesh, id }) => {
        if (collectedRef.current.has(id)) { mesh.visible = false; return; }
        mesh.rotation.y += 0.02;
        mesh.position.y = 0.9 + Math.sin(elapsed * 2 + mesh.position.x) * 0.05;
      });

      // Move granny toward player
      grannyTimer += dt;
      if (grannyTimer > 0.05 && grannyAlertRef.current) {
        grannyTimer = 0;
        const gp = grannyPosRef.current;
        const cp = camPosRef.current;
        const dx = cp.x - gp.x;
        const dz = cp.z - gp.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          const nx = gp.x + (dx / dist) * GRANNY_SPEED * 60 * dt;
          const nz = gp.z + (dz / dist) * GRANNY_SPEED * 60 * dt;
          if (canWalk(nx, nz)) {
            grannyPosRef.current = { x: nx, z: nz };
            if (grannyRef.current) {
              grannyRef.current.position.set(nx, 1.0, nz);
              grannyRef.current.lookAt(cp.x, 1.0, cp.z);
            }
          }
        } else {
          // Granny caught player
          setPlayers(prev => {
            const idx = currentTurnRef.current - 1;
            const newP = [...prev] as [PlayerState, PlayerState];
            newP[idx] = { ...newP[idx], hp: Math.max(0, newP[idx].hp - 2) };
            if (newP[idx].hp <= 0) {
              newP[idx] = { ...newP[idx], isAlive: false };
              if (!newP[0].isAlive && !newP[1].isAlive) setGameOver('death');
            }
            return newP;
          });
          noiseRef.current = Math.min(100, noiseRef.current + 1);
          setNoise(noiseRef.current);
        }
      }

      // Move granny without alert (patrol)
      if (!grannyAlertRef.current && grannyTimer > 0.05) {
        grannyTimer = 0;
        const gp = grannyPosRef.current;
        const wanderX = gp.x + (Math.random() - 0.5) * 0.3;
        const wanderZ = gp.z + (Math.random() - 0.5) * 0.3;
        if (canWalk(wanderX, wanderZ)) {
          grannyPosRef.current = { x: wanderX, z: wanderZ };
          if (grannyRef.current) grannyRef.current.position.set(wanderX, 1.0, wanderZ);
        }
      }

      // Movement
      if (document.pointerLockElement === renderer.domElement) {
        const fwd = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
        const right = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
        let moved = false;

        const cp = camPosRef.current;
        let nx = cp.x;
        let nz = cp.z;

        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) {
          nx += fwd.x * MOVE_SPEED; nz += fwd.z * MOVE_SPEED; moved = true;
        }
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) {
          nx -= fwd.x * MOVE_SPEED; nz -= fwd.z * MOVE_SPEED; moved = true;
        }
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
          nx -= right.x * MOVE_SPEED; nz -= right.z * MOVE_SPEED; moved = true;
        }
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
          nx += right.x * MOVE_SPEED; nz += right.z * MOVE_SPEED; moved = true;
        }

        // Collision
        const margin = 0.35;
        if (canWalk(nx + margin, cp.z) && canWalk(nx - margin, cp.z)) {
          camPosRef.current.x = nx;
        }
        if (canWalk(cp.x, nz + margin) && canWalk(cp.x, nz - margin)) {
          camPosRef.current.z = nz;
        }

        if (moved) {
          noiseRef.current = Math.min(100, noiseRef.current + 0.1);
          setNoise(Math.round(noiseRef.current));
          if (noiseRef.current > 70 && !grannyAlertRef.current) {
            grannyAlertRef.current = true;
            setGrannyAlert(true);
            addLog('👵 ГРАНИ ПРОСНУЛАСЬ!');
          }
        }

        camera.position.set(
          camPosRef.current.x,
          PLAYER_H + Math.sin(elapsed * 8) * (moved ? 0.04 : 0),
          camPosRef.current.z
        );
        camera.rotation.set(0, yawRef.current, 0);
        camera.rotation.order = 'YXZ';
      }

      // Nearby interactable check
      let closestId: string | null = null;
      let closestDist = INTERACT_DIST;
      INTERACTABLES.forEach(obj => {
        if (collectedRef.current.has(obj.id)) return;
        const dx = camPosRef.current.x - obj.pos[0];
        const dz = camPosRef.current.z - obj.pos[2];
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < closestDist) { closestDist = d; closestId = obj.id; }
      });
      if (closestId !== nearId) {
        nearId = closestId;
        setNearbyInteractable(closestId);
      }

      renderer.render(scene, camera);
    };

    loop();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [addLog]);

  // ---- KEYBOARD ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyE' && nearbyInteractable && !activePuzzle && !note) {
        handleInteract(nearbyInteractable);
      }
      if (e.code === 'Escape') {
        if (activePuzzle) { setActivePuzzle(null); setPuzzleAnswer(''); setPuzzleFeedback('idle'); }
        if (note) setNote(null);
      }
    };
    const up = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [nearbyInteractable, activePuzzle, note]);

  // ---- TIMER ----
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameOver('death'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  // ---- NOISE DECAY ----
  useEffect(() => {
    const t = setInterval(() => {
      if (noiseRef.current > 0) {
        noiseRef.current = Math.max(0, noiseRef.current - 0.5);
        setNoise(Math.round(noiseRef.current));
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  const handleInteract = useCallback((id: string) => {
    const obj = INTERACTABLES.find(o => o.id === id);
    if (!obj) return;

    if (obj.type === 'note') {
      setNote(obj.text as string);
      return;
    }

    if (obj.type === 'item') {
      if (collectedRef.current.has(id)) return;
      collectedRef.current = new Set([...collectedRef.current, id]);
      setCollecteds(new Set(collectedRef.current));
      if (obj.item === 'medkit') {
        const idx = currentTurnRef.current - 1;
        setPlayers(prev => {
          const newP = [...prev] as [PlayerState, PlayerState];
          newP[idx] = { ...newP[idx], hp: Math.min(100, newP[idx].hp + 30) };
          return newP;
        });
        addLog(`💊 Игрок ${currentTurnRef.current} подобрал аптечку! +30 HP`);
      }
      return;
    }

    if (obj.type === 'door') {
      const player = playersRef.current[currentTurnRef.current - 1];
      if (obj.keyRequired && !player.keys.includes(obj.keyRequired)) {
        addLog(`🔒 Нужен ключ: ${obj.keyRequired}`);
        return;
      }
      if (obj.id === 'door_exit') {
        addLog('🚪 Выход открыт! Оба должны добраться сюда.');
        const both = playersRef.current.every(p => p.isAlive);
        if (both) setGameOver('victory');
        return;
      }
      unlockedRef.current = new Set([...unlockedRef.current, obj.id]);
      setUnlockedDoors(new Set(unlockedRef.current));
      addLog(`🚪 Дверь открыта: ${obj.label}`);
      return;
    }

    if (obj.type === 'puzzle') {
      if (solvedRef.current.has(obj.roomId as string)) {
        addLog('✓ Эта загадка уже решена');
        return;
      }
      if (document.pointerLockElement) document.exitPointerLock();
      setActivePuzzle(obj.roomId as string);
      setPuzzleAnswer('');
      setPuzzleFeedback('idle');
    }
  }, [addLog]);

  const handlePuzzleSubmit = useCallback(() => {
    if (!activePuzzle) return;
    const pdata = PUZZLES_DATA[activePuzzle];
    if (!pdata) return;

    let correct = false;
    if (pdata.type === 'code') {
      correct = puzzleAnswer.trim().toUpperCase() === String(pdata.answer).toUpperCase();
    }

    if (correct) {
      setPuzzleFeedback('correct');
      solvedRef.current = new Set([...solvedRef.current, activePuzzle]);
      setSolvedPuzzles(new Set(solvedRef.current));
      addLog(`🧩 Игрок ${currentTurnRef.current} решил: "${pdata.title}"`);

      if (pdata.rewardKey) {
        const idx = currentTurnRef.current - 1;
        setPlayers(prev => {
          const newP = [...prev] as [PlayerState, PlayerState];
          newP[idx] = { ...newP[idx], keys: [...newP[idx].keys, pdata.rewardKey!] };
          return newP;
        });
        addLog(`🔑 Получен: ${pdata.reward}`);
      } else {
        addLog(`✓ ${pdata.reward}`);
      }

      setTimeout(() => {
        setActivePuzzle(null);
        setPuzzleAnswer('');
        setPuzzleFeedback('idle');
      }, 1000);
    } else {
      setPuzzleFeedback('wrong');
      const idx = currentTurnRef.current - 1;
      setPlayers(prev => {
        const newP = [...prev] as [PlayerState, PlayerState];
        newP[idx] = { ...newP[idx], hp: Math.max(0, newP[idx].hp - 10), sanity: Math.max(0, newP[idx].sanity - 10) };
        return newP;
      });
      noiseRef.current = Math.min(100, noiseRef.current + 15);
      setNoise(Math.round(noiseRef.current));
      addLog(`⚠ Игрок ${currentTurnRef.current} ошибся! −10 HP, −10 рассудка`);
      setTimeout(() => setPuzzleFeedback('idle'), 700);
    }
  }, [activePuzzle, puzzleAnswer, addLog]);

  const handleOptionSelect = useCallback((idx: number) => {
    if (!activePuzzle) return;
    const pdata = PUZZLES_DATA[activePuzzle];
    if (pdata?.type !== 'options') return;

    if (idx === pdata.correctIdx) {
      setPuzzleFeedback('correct');
      solvedRef.current = new Set([...solvedRef.current, activePuzzle]);
      setSolvedPuzzles(new Set(solvedRef.current));
      addLog(`🧩 Решено: "${pdata.title}"`);
      if (pdata.rewardKey) {
        const pidx = currentTurnRef.current - 1;
        setPlayers(prev => {
          const newP = [...prev] as [PlayerState, PlayerState];
          newP[pidx] = { ...newP[pidx], keys: [...newP[pidx].keys, pdata.rewardKey!] };
          return newP;
        });
        addLog(`🔑 ${pdata.reward}`);
      } else {
        addLog(`✓ ${pdata.reward}`);
        if (activePuzzle === 'ward2') {
          const pidx = currentTurnRef.current - 1;
          setPlayers(prev => {
            const newP = [...prev] as [PlayerState, PlayerState];
            newP[pidx] = { ...newP[pidx], hp: Math.min(100, newP[pidx].hp + 30) };
            return newP;
          });
        }
      }
      setTimeout(() => { setActivePuzzle(null); setPuzzleFeedback('idle'); }, 900);
    } else {
      setPuzzleFeedback('wrong');
      const pidx = currentTurnRef.current - 1;
      setPlayers(prev => {
        const newP = [...prev] as [PlayerState, PlayerState];
        newP[pidx] = { ...newP[pidx], hp: Math.max(0, newP[pidx].hp - 10), sanity: Math.max(0, newP[pidx].sanity - 10) };
        return newP;
      });
      addLog(`⚠ Неверно! −10 HP`);
      setTimeout(() => setPuzzleFeedback('idle'), 700);
    }
  }, [activePuzzle, addLog]);

  const lockPointer = () => {
    rendererRef.current?.domElement.requestPointerLock();
  };

  const endTurn = () => {
    const next: 1 | 2 = currentTurn === 1 ? 2 : 1;
    setCurrentTurn(next);
    addLog(`↩ Ход передан Игроку ${next}`);
    camPosRef.current = next === 1
      ? { x: 10 * CELL + 1, z: 6 * CELL + 1 }
      : { x: 10 * CELL + 3, z: 6 * CELL + 1 };
    yawRef.current = 0;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const currentPlayer = players[currentTurn - 1];
  const pdata = activePuzzle ? PUZZLES_DATA[activePuzzle] : null;
  const nearObj = nearbyInteractable ? INTERACTABLES.find(o => o.id === nearbyInteractable) : null;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D viewport */}
      <div ref={mountRef} className="absolute inset-0" onClick={!activePuzzle && !note ? lockPointer : undefined} />

      {/* Overlay vignette */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20"
        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)' }} />

      {/* Crosshair */}
      {isPointerLocked && !activePuzzle && !note && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-6 h-6">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
            <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400/80" />
          </div>
        </div>
      )}

      {/* Click to lock */}
      {!isPointerLocked && !activePuzzle && !note && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
          <div className="text-center">
            <div className="text-4xl mb-4">🖱</div>
            <div className="font-horror text-2xl text-blood mb-2">Кликните чтобы начать</div>
            <div className="font-typewriter text-gray-500 text-sm">WASD — движение | E — взаимодействие | Мышь — поворот</div>
          </div>
        </div>
      )}

      {/* HUD - TOP */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-3 pointer-events-none">
        {/* Players */}
        <div className="flex gap-2">
          {players.map((p, i) => (
            <div key={p.id} className={`bg-black/80 border rounded px-2 py-1 text-[10px] font-typewriter ${
              currentTurn === p.id ? (p.id === 1 ? 'border-red-700 ring-1 ring-red-600' : 'border-blue-700 ring-1 ring-blue-600') : 'border-gray-800 opacity-60'
            }`}>
              <div className={`font-horror text-sm ${p.id === 1 ? 'text-red-400' : 'text-blue-400'}`}>
                {p.id === 1 ? '🔴' : '🔵'} {p.name}
              </div>
              <div className="flex gap-2 mt-0.5">
                <div>
                  <div className="text-[9px] text-gray-600">HP</div>
                  <div className="w-16 h-1.5 bg-gray-900 rounded overflow-hidden">
                    <div className="h-full rounded transition-all" style={{ width: `${p.hp}%`, background: p.hp > 50 ? '#16a34a' : p.hp > 25 ? '#ca8a04' : '#dc2626' }} />
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600">Рассудок</div>
                  <div className="w-16 h-1.5 bg-gray-900 rounded overflow-hidden">
                    <div className="h-full rounded transition-all bg-purple-600" style={{ width: `${p.sanity}%` }} />
                  </div>
                </div>
              </div>
              {p.keys.length > 0 && <div className="text-[9px] text-yellow-600 mt-0.5">🔑 {p.keys.join(', ')}</div>}
            </div>
          ))}
        </div>

        {/* Timer & noise */}
        <div className="flex flex-col items-end gap-1">
          <div className={`font-horror text-xl ${timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
            ⏱ {fmt(timeLeft)}
          </div>
          <div className="flex items-center gap-1.5 bg-black/70 rounded px-2 py-1">
            <span className="text-[10px] font-typewriter text-gray-600">ШУМ</span>
            <div className="w-20 h-1.5 bg-gray-900 rounded overflow-hidden">
              <div className="h-full rounded transition-all"
                style={{ width: `${noise}%`, background: noise > 70 ? '#dc2626' : noise > 40 ? '#ca8a04' : '#16a34a' }} />
            </div>
            <span className="text-[10px] font-typewriter text-gray-500">{noise}%</span>
          </div>
          {grannyAlert && <div className="text-red-500 text-xs font-horror animate-pulse">👵 ГРАНИ АКТИВНА!</div>}
        </div>
      </div>

      {/* HUD - BOTTOM */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-between items-end p-3">
        {/* Log */}
        <div className="max-w-xs">
          {logs.slice(-3).map((l, i) => (
            <div key={i} className="text-[11px] font-typewriter text-gray-500 leading-tight"
              style={{ opacity: 0.4 + i * 0.3 }}>{l}</div>
          ))}
        </div>

        {/* Controls hint & turn */}
        <div className="flex flex-col items-end gap-2">
          {nearObj && !activePuzzle && !note && (
            <div className="bg-black/80 border border-yellow-800 rounded px-3 py-1 text-xs font-typewriter text-yellow-400 animate-pulse">
              [E] {nearObj.label}
            </div>
          )}
          <div className="flex gap-2 pointer-events-auto">
            <div className={`bg-black/80 border rounded px-2 py-1 text-[10px] font-typewriter ${
              currentTurn === 1 ? 'border-red-800 text-red-400' : 'border-blue-800 text-blue-400'
            }`}>
              Ходит: {currentPlayer.name}
            </div>
            <button onClick={endTurn}
              className="btn-horror px-3 py-1 rounded text-xs font-typewriter">
              Передать ход →
            </button>
          </div>
          <div className="text-[10px] font-typewriter text-gray-700">
            {solvedPuzzles.size}/5 загадок • {isPointerLocked ? 'ESC — пауза' : 'Клик — управление'}
          </div>
        </div>
      </div>

      {/* NOTE OVERLAY */}
      {note && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="max-w-sm bg-gray-950 border border-yellow-900 rounded-lg p-6 mx-4">
            <div className="font-horror text-yellow-500 text-lg mb-3">📄 Записка</div>
            <p className="font-typewriter text-gray-300 text-sm leading-relaxed mb-4">{note}</p>
            <button onClick={() => setNote(null)} className="btn-horror px-4 py-2 rounded font-typewriter text-sm">
              Закрыть [ESC]
            </button>
          </div>
        </div>
      )}

      {/* PUZZLE OVERLAY */}
      {activePuzzle && pdata && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`max-w-md w-full mx-4 bg-gray-950 rounded-lg overflow-hidden border ${
            currentTurn === 1 ? 'border-red-800' : 'border-blue-800'
          }`} style={{ boxShadow: currentTurn === 1 ? '0 0 30px rgba(139,0,0,0.3)' : '0 0 30px rgba(0,68,204,0.3)' }}>
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-900">
              <div className={`font-horror text-lg ${currentTurn === 1 ? 'text-red-400' : 'text-blue-400'}`}>{pdata.title}</div>
              <div className="text-[10px] font-typewriter text-gray-600">{currentPlayer.name} — {pdata.reward}</div>
            </div>

            {puzzleFeedback !== 'idle' && (
              <div className={`px-5 py-2 text-center font-horror text-sm ${puzzleFeedback === 'correct' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                {puzzleFeedback === 'correct' ? '✓ ВЕРНО!' : '✗ НЕВЕРНО! −10 HP'}
              </div>
            )}

            <div className="px-5 py-4">
              <p className="font-typewriter text-sm text-gray-300 mb-4 leading-relaxed">{pdata.question}</p>

              {pdata.type === 'code' && (
                <div className="space-y-3">
                  <input type="text" value={puzzleAnswer} onChange={e => setPuzzleAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePuzzleSubmit()}
                    placeholder="Введите ответ..." autoFocus maxLength={20}
                    className="w-full input-horror rounded px-3 py-2 text-sm" />
                  <button onClick={handlePuzzleSubmit} disabled={!puzzleAnswer.trim()}
                    className="w-full btn-horror py-2 rounded text-sm font-typewriter disabled:opacity-40">
                    Подтвердить
                  </button>
                </div>
              )}

              {pdata.type === 'options' && (
                <div className="grid grid-cols-2 gap-2">
                  {pdata.options?.map((opt, idx) => (
                    <button key={idx} onClick={() => handleOptionSelect(idx)}
                      className="btn-horror px-3 py-2 rounded text-sm font-typewriter text-left">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pb-4">
              <button onClick={() => { setActivePuzzle(null); setPuzzleAnswer(''); setPuzzleFeedback('idle'); }}
                className="text-xs text-gray-700 hover:text-red-500 font-typewriter transition-colors">
                Закрыть [ESC]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: gameOver === 'victory' ? 'radial-gradient(ellipse, #001a00, #000)' : 'radial-gradient(ellipse, #1a0000, #000)' }}>
          <div className="text-center px-4">
            <div className="text-8xl mb-6">{gameOver === 'victory' ? '🚨' : '💀'}</div>
            <h1 className={`font-horror text-5xl mb-3 ${gameOver === 'victory' ? 'text-green-400' : 'text-red-600'}`}>
              {gameOver === 'victory' ? 'ПОБЕГ УДАЛСЯ!' : 'ВЫ ПОГИБЛИ'}
            </h1>
            <p className="font-typewriter text-gray-500 mb-6 text-sm">
              {gameOver === 'victory' ? 'Вы вырвались из больницы!' : 'Больница забрала вас...'}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={onExit} className="btn-horror px-6 py-3 rounded-lg font-horror text-base">
                В главное меню
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game3D;
