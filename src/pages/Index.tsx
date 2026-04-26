import { useState, useEffect, useCallback } from 'react';
import { GameState, GameScreen, Player } from '@/types/game';
import { INITIAL_ROOMS, INITIAL_PUZZLES } from '@/data/gameData';
import HospitalMap from '@/components/game/HospitalMap';
import PlayerCard from '@/components/game/PlayerCard';
import PuzzleModal from '@/components/game/PuzzleModal';
import GameLog from '@/components/game/GameLog';

const GRANNY_ROOMS = ['corridor1', 'ward1', 'operating', 'lab'];

const makeInitialState = (p1Name: string, p2Name: string): GameState => ({
  screen: 'game',
  players: [
    { id: 1, name: p1Name || 'Игрок 1', hp: 100, maxHp: 100, sanity: 100, position: 'entrance', isAlive: true, keys: [], items: [], isTurn: true },
    { id: 2, name: p2Name || 'Игрок 2', hp: 100, maxHp: 100, sanity: 100, position: 'entrance', isAlive: true, keys: [], items: [], isTurn: false },
  ],
  currentRoom: 'entrance',
  rooms: INITIAL_ROOMS.map(r => ({ ...r })),
  puzzles: INITIAL_PUZZLES.map(p => ({ ...p, data: { ...p.data } })),
  turn: 1,
  turnCount: 1,
  noise: 0,
  grannyAlerted: false,
  grannyPosition: 'operating',
  gameLog: ['📖 Вы входите в заброшенную психиатрическую больницу...', '🚪 Выход заперт. Найдите ключи и решите головоломки!', '⚠ Двигайтесь тихо — Грани слышит каждый шаг.'],
  timeLeft: 900,
  difficulty: 'normal',
});

const Index = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);
  const [flickerOn, setFlickerOn] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.05) {
        setFlickerOn(false);
        setTimeout(() => setFlickerOn(true), 80 + Math.random() * 200);
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!gameState || gameState.screen !== 'game') return;
    const t = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        if (prev.timeLeft <= 0) return { ...prev, screen: 'death' };
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState?.screen]);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, gameLog: [...prev.gameLog, msg].slice(-30) };
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      const nextTurn: 1 | 2 = prev.turn === 1 ? 2 : 1;
      const p2alive = prev.players[1].isAlive;
      const finalTurn: 1 | 2 = nextTurn === 2 && !p2alive ? 1 : nextTurn;
      return {
        ...prev,
        turn: finalTurn,
        turnCount: prev.turnCount + 1,
        players: prev.players.map(p => ({ ...p, isTurn: p.id === finalTurn })) as [Player, Player]
      };
    });
  }, []);

  const moveToRoom = useCallback((roomId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const room = prev.rooms.find(r => r.id === roomId);
      if (!room) return prev;
      const currentPlayer = prev.players[prev.turn - 1];
      const currentRoom = prev.rooms.find(r => r.id === currentPlayer.position);
      if (!currentRoom?.connections.includes(roomId) && roomId !== currentPlayer.position) return prev;
      if (room.isLocked && !currentPlayer.keys.includes(room.lockKey ?? '')) return prev;

      const newPlayers = [...prev.players] as [Player, Player];
      newPlayers[prev.turn - 1] = { ...currentPlayer, position: roomId };
      let newNoise = prev.noise;
      const newLogs = [...prev.gameLog];
      let newGrannyAlerted = prev.grannyAlerted;
      let newGrannyPos = prev.grannyPosition;

      if (room.isDanger) {
        newNoise = Math.min(100, newNoise + 15);
        newLogs.push(`⚠ ${currentPlayer.name} вошёл в опасную зону! Шум: ${newNoise}`);
      }

      if (room.event && Math.random() < 0.6) {
        const ev = room.event;
        if (ev.type === 'trap' && ev.damage) {
          newPlayers[prev.turn - 1] = {
            ...newPlayers[prev.turn - 1],
            hp: Math.max(0, newPlayers[prev.turn - 1].hp - ev.damage),
            sanity: Math.max(0, newPlayers[prev.turn - 1].sanity - (ev.sanityDamage ?? 0))
          };
          newNoise = Math.min(100, newNoise + 20);
          newLogs.push(`⚠ ЛОВУШКА! ${currentPlayer.name} −${ev.damage} HP. ${ev.description}`);
        } else if (ev.type === 'monster' && ev.damage && room.id !== 'operating') {
          newPlayers[prev.turn - 1] = {
            ...newPlayers[prev.turn - 1],
            hp: Math.max(0, newPlayers[prev.turn - 1].hp - ev.damage),
            sanity: Math.max(0, newPlayers[prev.turn - 1].sanity - (ev.sanityDamage ?? 0))
          };
          newNoise = Math.min(100, newNoise + 30);
          newLogs.push(`💀 МОНСТР! ${currentPlayer.name} −${ev.damage} HP.`);
        }
      }

      if (newNoise >= 70 && !newGrannyAlerted) {
        newGrannyAlerted = true;
        newLogs.push('👵 ГРАНИ ПРОСНУЛАСЬ! Она идёт на звук...');
      }

      if (newGrannyAlerted && prev.turnCount % 3 === 0) {
        const available = GRANNY_ROOMS.filter(r => r !== newGrannyPos);
        newGrannyPos = available[Math.floor(Math.random() * available.length)];
        newLogs.push(`👵 Грани → ${prev.rooms.find(r => r.id === newGrannyPos)?.name}`);
        if (newGrannyPos === roomId) {
          newPlayers[prev.turn - 1] = {
            ...newPlayers[prev.turn - 1],
            hp: Math.max(0, newPlayers[prev.turn - 1].hp - 35),
            sanity: Math.max(0, newPlayers[prev.turn - 1].sanity - 30)
          };
          newLogs.push(`👵 ГРАНИ НАПАЛА на ${currentPlayer.name}! −35 HP!`);
        }
      }

      if (newPlayers[prev.turn - 1].hp <= 0) {
        newPlayers[prev.turn - 1] = { ...newPlayers[prev.turn - 1], isAlive: false };
        newLogs.push(`💀 ${currentPlayer.name} погиб...`);
        if (!newPlayers[0].isAlive && !newPlayers[1].isAlive) {
          return { ...prev, players: newPlayers, gameLog: newLogs, screen: 'death' };
        }
      }

      return {
        ...prev,
        players: newPlayers,
        currentRoom: roomId,
        noise: newNoise,
        grannyAlerted: newGrannyAlerted,
        grannyPosition: newGrannyPos,
        gameLog: newLogs.slice(-30),
      };
    });
  }, []);

  const handleRoomClick = useCallback((roomId: string) => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.turn - 1];
    if (currentPlayer.position === roomId) return;
    const targetRoom = gameState.rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    if (targetRoom.isLocked && !currentPlayer.keys.includes(targetRoom.lockKey ?? '')) {
      addLog(`🔒 Нужен ключ: ${targetRoom.lockKey}`);
      return;
    }

    moveToRoom(roomId);

    if (targetRoom.puzzleId) {
      const puzzle = gameState.puzzles.find(p => p.id === targetRoom.puzzleId);
      if (puzzle && !puzzle.solved) {
        setTimeout(() => setActivePuzzleId(targetRoom.puzzleId!), 400);
      }
    }

    const bothAtExit =
      (gameState.players[0].position === 'exit' || (gameState.turn === 1 && roomId === 'exit')) &&
      (gameState.players[1].position === 'exit' || (gameState.turn === 2 && roomId === 'exit'));
    if (bothAtExit) {
      setTimeout(() => setGameState(prev => prev ? { ...prev, screen: 'victory' } : prev), 800);
    }
  }, [gameState, addLog, moveToRoom]);

  const handlePuzzleSolve = useCallback((puzzleId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const puzzle = prev.puzzles.find(p => p.id === puzzleId);
      if (!puzzle) return prev;
      const idx = prev.turn - 1;
      const currentPlayer = prev.players[idx];
      const newPlayers = [...prev.players] as [Player, Player];
      const newRooms = prev.rooms.map(r => ({ ...r }));
      const newLogs = [...prev.gameLog];

      newLogs.push(`🧩 ${currentPlayer.name} решил: "${puzzle.title}"!`);

      if (puzzle.rewardKey) {
        newPlayers[idx] = { ...newPlayers[idx], keys: [...newPlayers[idx].keys, puzzle.rewardKey] };
        newLogs.push(`🔑 Получен: ${puzzle.reward}`);
        const roomToUnlock = newRooms.find(r => r.lockKey === puzzle.rewardKey);
        if (roomToUnlock) roomToUnlock.isLocked = false;
      } else {
        newLogs.push(`✓ ${puzzle.reward}`);
      }

      const roomWithPuzzle = newRooms.find(r => r.id === puzzle.roomId);
      if (roomWithPuzzle) roomWithPuzzle.isCompleted = true;

      newPlayers[idx] = { ...newPlayers[idx], sanity: Math.min(100, newPlayers[idx].sanity + 5) };

      return {
        ...prev,
        players: newPlayers,
        rooms: newRooms,
        puzzles: prev.puzzles.map(p => p.id === puzzleId ? { ...p, solved: true } : p),
        gameLog: newLogs.slice(-30),
        noise: Math.max(0, prev.noise - 10),
      };
    });
    setActivePuzzleId(null);
  }, []);

  const handlePuzzleFail = useCallback((damage: number, sanityDamage: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const idx = prev.turn - 1;
      const p = prev.players[idx];
      const newPlayers = [...prev.players] as [Player, Player];
      newPlayers[idx] = { ...p, hp: Math.max(0, p.hp - damage), sanity: Math.max(0, p.sanity - sanityDamage) };
      return {
        ...prev,
        players: newPlayers,
        noise: Math.min(100, prev.noise + 20),
        gameLog: [...prev.gameLog, `⚠ ${p.name} провалил головоломку! −${damage} HP`].slice(-30)
      };
    });
    setActivePuzzleId(null);
  }, []);

  const applyItem = useCallback((item: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const idx = prev.turn - 1;
      const player = prev.players[idx];
      if (item === 'medkit' && player.items.includes('medkit')) {
        const newPlayers = [...prev.players] as [Player, Player];
        const firstIdx = player.items.indexOf('medkit');
        newPlayers[idx] = {
          ...player,
          hp: Math.min(player.maxHp, player.hp + 30),
          items: player.items.filter((_, i) => i !== firstIdx)
        };
        return { ...prev, players: newPlayers, gameLog: [...prev.gameLog, `💊 ${player.name} +30 HP`].slice(-30) };
      }
      return prev;
    });
  }, []);

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const activePuzzle = gameState?.puzzles.find(p => p.id === activePuzzleId);
  const currentPlayerObj = gameState?.players[(gameState?.turn ?? 1) - 1];
  const isDead = gameState?.screen === 'death';
  const isVictory = gameState?.screen === 'victory';

  return (
    <div className={`min-h-screen bg-black relative overflow-hidden transition-all duration-75 ${!flickerOn ? 'brightness-50' : ''}`}>
      <div className="fixed inset-0 pointer-events-none z-50"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.88) 100%)' }}
      />

      {/* ═══ MENU ═══ */}
      {screen === 'menu' && (
        <div className="min-h-screen flex flex-col items-center justify-center relative"
          style={{ background: 'radial-gradient(ellipse at center, #0d0005 0%, #000 70%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#1a0000 39px,#1a0000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#1a0000 39px,#1a0000 40px)' }}
          />
          <div className="relative z-10 text-center px-4 max-w-md w-full">
            <div className="mb-3 text-7xl float-anim">🏥</div>
            <h1 className="font-horror text-6xl text-blood mb-1 flicker"
              style={{ textShadow: '0 0 30px #8b0000, 0 0 60px #4a0000' }}>
              ПАЛАТА 13
            </h1>
            <p className="font-typewriter text-gray-600 text-xs mb-8 tracking-widest uppercase">
              Побег из психиатрической больницы
            </p>

            <div className="bg-gray-950/90 border border-gray-800 rounded-lg p-5 mb-5 space-y-3">
              <div className="text-left space-y-1">
                <label className="text-[10px] font-typewriter text-red-400 tracking-widest uppercase">Игрок 1 (красный)</label>
                <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)}
                  placeholder="Имя первого выжившего..." maxLength={20}
                  className="w-full input-horror rounded px-3 py-2 text-sm border border-red-900/40 focus:border-red-700" />
              </div>
              <div className="text-left space-y-1">
                <label className="text-[10px] font-typewriter text-blue-400 tracking-widest uppercase">Игрок 2 (синий)</label>
                <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)}
                  placeholder="Имя второго выжившего..." maxLength={20}
                  className="w-full input-horror rounded px-3 py-2 text-sm border border-blue-900/40 focus:border-blue-700" />
              </div>
            </div>

            <button
              onClick={() => { setGameState(makeInitialState(p1Name, p2Name)); setScreen('game'); }}
              className="btn-horror w-full py-3 rounded-lg font-horror text-xl tracking-wider mb-4"
            >
              ВОЙТИ В БОЛЬНИЦУ
            </button>

            <div className="grid grid-cols-3 gap-2">
              {[{ icon: '🗺', label: '10 комнат' }, { icon: '🧩', label: '7 головоломок' }, { icon: '👵', label: 'Грани охотится' }]
                .map(x => (
                  <div key={x.icon} className="bg-gray-950 border border-gray-800 rounded p-2 text-center">
                    <div className="text-2xl mb-1">{x.icon}</div>
                    <div className="text-[10px] font-typewriter text-gray-600">{x.label}</div>
                  </div>
                ))}
            </div>

            <p className="mt-5 text-[10px] font-typewriter text-gray-700">
              Ходы чередуются. Оба игрока должны добраться до выхода.
            </p>
          </div>
        </div>
      )}

      {/* ═══ GAME ═══ */}
      {screen === 'game' && gameState && !isDead && !isVictory && (
        <div className="min-h-screen hospital-floor">
          {/* Topbar */}
          <div className="sticky top-0 z-40 bg-black/95 border-b border-gray-800 px-4 py-2 flex items-center justify-between gap-4">
            <div className="font-horror text-blood text-base">🏥 ПАЛАТА 13</div>
            <div className="flex items-center gap-3 flex-1 justify-center">
              <div className={`font-typewriter text-sm ${gameState.timeLeft < 120 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                ⏱ {formatTime(gameState.timeLeft)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-typewriter text-gray-600">ШУМ</span>
                <div className="w-16 h-1.5 rounded-full bg-gray-900 border border-gray-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${gameState.noise}%`,
                      background: gameState.noise > 70 ? '#cc0000' : gameState.noise > 40 ? '#aa6600' : '#006600',
                      boxShadow: gameState.noise > 70 ? '0 0 4px #cc0000' : 'none'
                    }} />
                </div>
                <span className="text-[10px] font-typewriter text-gray-600">{gameState.noise}%</span>
              </div>
              {gameState.grannyAlerted && <span className="text-red-500 text-[10px] font-horror animate-pulse">👵 АКТИВНА</span>}
            </div>
            <div className="text-[10px] text-gray-600 font-typewriter">Ход {gameState.turnCount}</div>
          </div>

          <div className="flex" style={{ height: 'calc(100vh - 44px)' }}>
            {/* Left panel */}
            <div className="w-52 flex-shrink-0 border-r border-gray-900 bg-black/70 p-3 flex flex-col gap-2 overflow-y-auto">
              <div className="text-[9px] font-typewriter text-gray-700 tracking-widest uppercase">Выжившие</div>
              {gameState.players.map(p => (
                <PlayerCard key={p.id} player={p} isActive={p.id === gameState.turn && p.isAlive} />
              ))}

              <div className="border border-gray-800 rounded bg-gray-950/80 p-2 mt-1">
                <div className="text-[9px] font-typewriter text-gray-700 mb-1 uppercase">Локация</div>
                {(() => {
                  const room = gameState.rooms.find(r => r.id === gameState.currentRoom);
                  return room ? (
                    <>
                      <div className="font-horror text-xs text-gray-300">{room.icon} {room.name}</div>
                      <div className="text-[10px] font-typewriter text-gray-600 mt-0.5 leading-tight">{room.description}</div>
                      {room.isDanger && <div className="text-[10px] text-red-500 mt-1">⚠ Опасная зона</div>}
                    </>
                  ) : null;
                })()}
              </div>

              {currentPlayerObj && currentPlayerObj.items.length > 0 && (
                <div className="border border-gray-800 rounded bg-gray-950/80 p-2">
                  <div className="text-[9px] font-typewriter text-gray-700 mb-1 uppercase">Предметы</div>
                  {currentPlayerObj.items.map((item, i) => (
                    <button key={i} onClick={() => applyItem('medkit')}
                      className="w-full text-left btn-horror px-2 py-1 rounded mb-1 text-[11px] font-typewriter">
                      {item === 'medkit' ? '💊 Аптечка' : `🔑 ${item}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-auto space-y-1">
                <div className={`text-center py-1.5 rounded text-[10px] font-typewriter border ${gameState.turn === 1 ? 'border-red-900/50 text-red-500' : 'border-blue-900/50 text-blue-500'}`}>
                  Ходит: {gameState.players[gameState.turn - 1].name}
                </div>
                <button onClick={() => { addLog(`↩ ${currentPlayerObj?.name} пропустил ход`); endTurn(); }}
                  className="w-full btn-horror py-2 rounded text-xs font-typewriter">
                  Пропустить ход →
                </button>
                <button onClick={() => { setScreen('menu'); setGameState(null); }}
                  className="w-full py-1.5 rounded text-[10px] font-typewriter text-gray-700 hover:text-red-500 transition-colors">
                  ← В меню
                </button>
              </div>
            </div>

            {/* Center: Map */}
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-3 flex justify-between items-center">
                <div className="font-horror text-xs text-gray-600">🗺 КАРТА БОЛЬНИЦЫ</div>
                <div className="text-[10px] font-typewriter text-gray-600">
                  {gameState.puzzles.filter(p => p.solved).length}/{gameState.puzzles.length} головоломок решено
                </div>
              </div>
              <HospitalMap
                rooms={gameState.rooms}
                currentRoom={gameState.currentRoom}
                players={gameState.players}
                grannyPosition={gameState.grannyPosition}
                onRoomClick={handleRoomClick}
              />
              <div className="mt-3 p-2 bg-gray-950 border border-gray-800 rounded text-[10px] font-typewriter text-gray-700">
                🎯 Оба игрока должны добраться до <span className="text-yellow-600">🚨 Выхода</span>. Решайте головоломки для получения ключей.
              </div>
            </div>

            {/* Right panel */}
            <div className="w-52 flex-shrink-0 border-l border-gray-900 bg-black/70 p-3 flex flex-col gap-2 overflow-y-auto">
              <div className="text-[9px] font-typewriter text-gray-700 tracking-widest uppercase">Журнал событий</div>
              <GameLog logs={gameState.gameLog} />

              <div className="text-[9px] font-typewriter text-gray-700 tracking-widest uppercase mt-1">Головоломки</div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {gameState.puzzles.map(puzzle => {
                  const room = gameState.rooms.find(r => r.id === puzzle.roomId);
                  return (
                    <div key={puzzle.id}
                      className={`p-1.5 rounded border text-[10px] font-typewriter ${puzzle.solved ? 'border-green-900/30 bg-green-950/20 text-green-800' : 'border-gray-800 bg-gray-950/50 text-gray-600'}`}>
                      {puzzle.solved ? '✓ ' : '? '}{puzzle.title}
                      <div className="text-[9px] text-gray-700">{room?.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DEATH ═══ */}
      {(isDead) && (
        <div className="min-h-screen flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, #1a0000 0%, #000 60%)' }}>
          <div className="text-center px-4 relative z-10">
            <div className="text-8xl mb-6 heartbeat">💀</div>
            <h1 className="font-horror text-5xl mb-3" style={{ color: '#cc0000', textShadow: '0 0 20px #8b0000' }}>ВЫ ПОГИБЛИ</h1>
            <p className="font-typewriter text-gray-600 mb-8 text-sm max-w-xs">
              {gameState?.timeLeft === 0 ? 'Время вышло. Грани нашла вас на рассвете...' : 'Больница поглотила вас...'}
            </p>
            {gameState && (
              <div className="mb-6 bg-gray-950 border border-gray-800 rounded p-4 text-sm font-typewriter text-gray-500 space-y-1">
                <div>⚔ Ходов: {gameState.turnCount}</div>
                <div>🧩 Решено: {gameState.puzzles.filter(p => p.solved).length}/{gameState.puzzles.length}</div>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setGameState(makeInitialState(p1Name, p2Name)); setScreen('game'); }}
                className="btn-horror px-6 py-3 rounded-lg font-horror text-base">
                Снова
              </button>
              <button onClick={() => { setScreen('menu'); setGameState(null); }}
                className="btn-horror px-6 py-3 rounded-lg font-horror text-base opacity-60">
                В меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VICTORY ═══ */}
      {isVictory && (
        <div className="min-h-screen flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, #001a00 0%, #000 60%)' }}>
          <div className="text-center px-4 relative z-10">
            <div className="text-8xl mb-6 float-anim">🚨</div>
            <h1 className="font-horror text-5xl mb-3 text-green-400" style={{ textShadow: '0 0 20px #00aa00' }}>ПОБЕГ УДАЛСЯ!</h1>
            <p className="font-typewriter text-gray-500 mb-8 max-w-sm text-sm">
              Вы вырвались из больницы! Грани осталась позади, а рассвет встречает выживших...
            </p>
            {gameState && (
              <div className="mb-6 bg-gray-950 border border-green-900/30 rounded p-4 text-sm font-typewriter text-gray-500 space-y-1">
                <div>⏱ Время: {formatTime(900 - (gameState.timeLeft ?? 0))}</div>
                <div>🧩 Головоломок: {gameState.puzzles.filter(p => p.solved).length}/{gameState.puzzles.length}</div>
                <div>❤ Выжило: {gameState.players.filter(p => p.isAlive).length}/2</div>
              </div>
            )}
            <button onClick={() => { setScreen('menu'); setGameState(null); }}
              className="btn-horror px-8 py-3 rounded-lg font-horror text-lg">
              В меню
            </button>
          </div>
        </div>
      )}

      {/* ═══ PUZZLE MODAL ═══ */}
      {activePuzzleId && activePuzzle && currentPlayerObj && (
        <PuzzleModal
          puzzle={activePuzzle}
          player={currentPlayerObj}
          onSolve={handlePuzzleSolve}
          onFail={handlePuzzleFail}
          onClose={() => setActivePuzzleId(null)}
        />
      )}
    </div>
  );
};

export default Index;