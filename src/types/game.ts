export type GameScreen = 'menu' | 'lobby' | 'game' | 'puzzle' | 'death' | 'victory';

export type PuzzleType = 'code' | 'wire' | 'medicine' | 'memory' | 'math' | 'symbol';

export interface Player {
  id: 1 | 2;
  name: string;
  hp: number;
  maxHp: number;
  sanity: number;
  position: string;
  isAlive: boolean;
  keys: string[];
  items: string[];
  isTurn: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  x: number;
  y: number;
  connections: string[];
  puzzleId?: string;
  isLocked: boolean;
  lockKey?: string;
  isCompleted: boolean;
  isDanger: boolean;
  dangerLevel: number;
  loot?: string[];
  event?: RoomEvent;
}

export interface RoomEvent {
  type: 'monster' | 'trap' | 'item' | 'story' | 'safe';
  description: string;
  damage?: number;
  sanityDamage?: number;
  reward?: string;
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  description: string;
  roomId: string;
  reward: string;
  rewardKey?: string;
  solved: boolean;
  assignedPlayer?: 1 | 2;
  data: PuzzleData;
}

export interface PuzzleData {
  question?: string;
  answer?: string | number;
  grid?: string[][];
  solution?: string[][];
  wires?: WireConnection[];
  sequence?: string[];
  playerSequence?: string[];
  options?: string[];
  correctOption?: number;
}

export interface WireConnection {
  from: string;
  to: string;
  color: string;
  connected: boolean;
}

export interface GameState {
  screen: GameScreen;
  players: [Player, Player];
  currentRoom: string;
  rooms: Room[];
  puzzles: Puzzle[];
  turn: 1 | 2;
  turnCount: number;
  noise: number;
  grannyAlerted: boolean;
  grannyPosition: string;
  gameLog: string[];
  timeLeft: number;
  difficulty: 'easy' | 'normal' | 'hard';
}
