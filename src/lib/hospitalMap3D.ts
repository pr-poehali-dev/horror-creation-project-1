// Map layout: 1 = wall, 0 = floor, 2 = door, 3 = window
export const HOSPITAL_MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,2,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,2,1,1,1,1,1,2,1,1,1,2,1,1,1,2,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const MAP_ROOMS = [
  { id: 'ward1',     name: 'Палата 13',      cx: 3.5,  cz: 2.5,  color: 0x1a0a0a, puzzle: 'memory',   key: null },
  { id: 'lab',       name: 'Лаборатория',    cx: 11,   cz: 2.5,  color: 0x0a1a0a, puzzle: 'code',     key: 'key_lab' },
  { id: 'storage',   name: 'Хранилище',      cx: 16.5, cz: 2.5,  color: 0x0a0a1a, puzzle: 'math',     key: 'key_exit' },
  { id: 'corridor',  name: 'Главный коридор',cx: 10,   cz: 6,    color: null,      puzzle: null,       key: null },
  { id: 'ward2',     name: 'Палата 6',       cx: 3.5,  cz: 10.5, color: 0x1a0808, puzzle: 'wire',     key: 'key_op' },
  { id: 'reception', name: 'Регистратура',   cx: 11,   cz: 10.5, color: 0x100a08, puzzle: 'symbol',   key: 'key_storage' },
  { id: 'operating', name: 'Операционная',   cx: 16.5, cz: 10.5, color: 0x200000, puzzle: 'code2',    key: null },
];

export const INTERACTABLES = [
  { id: 'door_lab',   pos: [6, 0, 4],   type: 'door',  locked: true,  keyRequired: 'key_lab',     label: '🔒 Дверь в Лабораторию' },
  { id: 'door_op',    pos: [14, 0, 4],  type: 'door',  locked: true,  keyRequired: 'key_op',      label: '🔒 Дверь в Операционную' },
  { id: 'door_exit',  pos: [18, 0, 8],  type: 'door',  locked: true,  keyRequired: 'key_exit',    label: '🚨 Аварийный выход' },
  { id: 'puzzle_w1',  pos: [2, 0, 2],   type: 'puzzle', roomId: 'ward1',     label: '❓ Осмотреть палату' },
  { id: 'puzzle_lab', pos: [10, 0, 2],  type: 'puzzle', roomId: 'lab',       label: '❓ Загадка лаборатории' },
  { id: 'puzzle_st',  pos: [16, 0, 2],  type: 'puzzle', roomId: 'storage',   label: '❓ Инвентаризация' },
  { id: 'puzzle_w2',  pos: [2, 0, 11],  type: 'puzzle', roomId: 'ward2',     label: '❓ Электрощит' },
  { id: 'puzzle_rec', pos: [10, 0, 11], type: 'puzzle', roomId: 'reception', label: '❓ Кодовый замок' },
  { id: 'medkit_1',   pos: [4, 0, 7],   type: 'item',  item: 'medkit',       label: '💊 Аптечка' },
  { id: 'medkit_2',   pos: [15, 0, 7],  type: 'item',  item: 'medkit',       label: '💊 Аптечка' },
  { id: 'note_1',     pos: [9, 0, 6],   type: 'note',  text: 'Код от сейфа: год основания — 19??. Ищи дату на стене регистратуры.',  label: '📄 Записка' },
  { id: 'note_2',     pos: [12, 0, 6],  type: 'note',  text: 'НЕ ВХОДИ В ОПЕРАЦИОННУЮ. ОНА ТАМ. — Д-р Краснов',                     label: '📄 Записка' },
];
