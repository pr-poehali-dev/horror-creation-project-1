import { Room, Puzzle } from '@/types/game';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'entrance',
    name: 'Вход',
    description: 'Разбитые стеклянные двери. Запах хлора и чего-то гнилого.',
    icon: '🚪',
    x: 3, y: 4,
    connections: ['corridor1', 'reception'],
    isLocked: false,
    isCompleted: false,
    isDanger: false,
    dangerLevel: 0,
    event: { type: 'story', description: 'Вы входите в заброшенную больницу. Где-то скрипит дверь...' }
  },
  {
    id: 'reception',
    name: 'Регистратура',
    description: 'Разбросанные бумаги, опрокинутый стол.',
    icon: '📋',
    x: 5, y: 4,
    connections: ['entrance', 'corridor1', 'office'],
    isLocked: false,
    isCompleted: false,
    isDanger: false,
    dangerLevel: 1,
    puzzleId: 'puzzle_code1',
    loot: ['key_office'],
    event: { type: 'item', description: 'На стойке лежит карточка с кодом.', reward: 'Ключ от кабинета' }
  },
  {
    id: 'corridor1',
    name: 'Коридор 1Б',
    description: 'Мигающий свет. На стенах — следы крови.',
    icon: '🏥',
    x: 3, y: 2,
    connections: ['entrance', 'reception', 'ward1', 'lab'],
    isLocked: false,
    isCompleted: false,
    isDanger: true,
    dangerLevel: 2,
    event: { type: 'trap', description: 'Скрипучий пол — Грани может услышать!', damage: 10, sanityDamage: 5 }
  },
  {
    id: 'office',
    name: 'Кабинет врача',
    description: 'Медицинские карты, разбитый шкаф.',
    icon: '🩺',
    x: 7, y: 3,
    connections: ['reception', 'storage'],
    isLocked: true,
    lockKey: 'key_office',
    isCompleted: false,
    isDanger: false,
    dangerLevel: 1,
    puzzleId: 'puzzle_medicine',
    loot: ['key_lab'],
    event: { type: 'item', description: 'В ящике стола — карта больницы!', reward: 'Ключ от лаборатории' }
  },
  {
    id: 'ward1',
    name: 'Палата 13',
    description: 'Ржавые кровати. Что-то зашевелилось под простынёй...',
    icon: '🛏',
    x: 1, y: 2,
    connections: ['corridor1', 'ward2'],
    isLocked: false,
    isCompleted: false,
    isDanger: true,
    dangerLevel: 3,
    puzzleId: 'puzzle_memory',
    event: { type: 'monster', description: 'В палате — тень!', damage: 20, sanityDamage: 15 }
  },
  {
    id: 'ward2',
    name: 'Палата 6',
    description: 'Электрокардиограф ещё работает. Пи-и-и...',
    icon: '💉',
    x: 0, y: 1,
    connections: ['ward1', 'operating'],
    isLocked: false,
    isCompleted: false,
    isDanger: true,
    dangerLevel: 2,
    puzzleId: 'puzzle_wire',
    loot: ['medkit'],
    event: { type: 'item', description: 'Под матрасом спрятана аптечка.', reward: 'Аптечка (+30 HP)' }
  },
  {
    id: 'lab',
    name: 'Лаборатория',
    description: 'Разбитые пробирки. Жёлтый туман стелется по полу.',
    icon: '🧪',
    x: 3, y: 0,
    connections: ['corridor1', 'operating'],
    isLocked: true,
    lockKey: 'key_lab',
    isCompleted: false,
    isDanger: true,
    dangerLevel: 3,
    puzzleId: 'puzzle_symbol',
    loot: ['key_operating'],
    event: { type: 'trap', description: 'Ядовитый газ! Задержи дыхание.', damage: 15, sanityDamage: 10 }
  },
  {
    id: 'storage',
    name: 'Хранилище',
    description: 'Бесконечные стеллажи с медикаментами.',
    icon: '📦',
    x: 7, y: 1,
    connections: ['office', 'operating'],
    isLocked: false,
    isCompleted: false,
    isDanger: false,
    dangerLevel: 1,
    puzzleId: 'puzzle_math',
    loot: ['medkit', 'key_exit'],
    event: { type: 'safe', description: 'Тихое место. Здесь можно отдышаться.' }
  },
  {
    id: 'operating',
    name: 'Операционная',
    description: 'Операционный стол. Инструменты в крови.',
    icon: '🔪',
    x: 3, y: -1,
    connections: ['ward2', 'lab', 'storage', 'exit'],
    isLocked: true,
    lockKey: 'key_operating',
    isCompleted: false,
    isDanger: true,
    dangerLevel: 4,
    puzzleId: 'puzzle_code2',
    event: { type: 'monster', description: 'Здесь живёт Грани. Будьте осторожны!', damage: 30, sanityDamage: 25 }
  },
  {
    id: 'exit',
    name: 'Выход (Подвал)',
    description: 'Запасной выход через подвал.',
    icon: '🚨',
    x: 5, y: -1,
    connections: ['operating'],
    isLocked: true,
    lockKey: 'key_exit',
    isCompleted: false,
    isDanger: true,
    dangerLevel: 5,
    event: { type: 'story', description: 'Это выход! Вы оба должны добраться сюда.' }
  }
];

export const INITIAL_PUZZLES: Puzzle[] = [
  {
    id: 'puzzle_code1',
    type: 'code',
    title: 'Кодовый замок',
    description: 'Сейф регистратуры заблокирован 4-значным кодом. Подсказка на стене: "Год основания больницы — 19??"',
    roomId: 'reception',
    reward: 'Ключ от кабинета врача',
    rewardKey: 'key_office',
    solved: false,
    data: {
      question: 'Введите 4-значный код (подсказка: "Дата основания — 1987")',
      answer: '1987',
      options: []
    }
  },
  {
    id: 'puzzle_medicine',
    type: 'code',
    title: 'Дозировка лекарств',
    description: 'Нужно правильно составить рецепт. Ошибка — и пациент умрёт.',
    roomId: 'office',
    reward: 'Ключ от лаборатории',
    rewardKey: 'key_lab',
    solved: false,
    data: {
      question: 'Пациент весит 70 кг. Доза — 2 мг/кг каждые 8 часов. Сколько мг в сутки?',
      answer: '420',
      options: ['280', '350', '420', '560'],
      correctOption: 2
    }
  },
  {
    id: 'puzzle_memory',
    type: 'memory',
    title: 'Последовательность символов',
    description: 'На стене нарисованы символы. Запомните порядок!',
    roomId: 'ward1',
    reward: 'Открыта дверь в Палату 6',
    solved: false,
    data: {
      sequence: ['☠', '🩸', '💊', '🔪', '☠', '🩸'],
      playerSequence: []
    }
  },
  {
    id: 'puzzle_wire',
    type: 'wire',
    title: 'Электрощит',
    description: 'Нужно правильно соединить провода чтобы включить свет.',
    roomId: 'ward2',
    reward: 'Ключ от операционной',
    rewardKey: 'key_operating',
    solved: false,
    data: {
      wires: [
        { from: 'A', to: '3', color: '#cc0000', connected: false },
        { from: 'B', to: '1', color: '#0044cc', connected: false },
        { from: 'C', to: '4', color: '#00aa00', connected: false },
        { from: 'D', to: '2', color: '#ccaa00', connected: false },
      ]
    }
  },
  {
    id: 'puzzle_symbol',
    type: 'symbol',
    title: 'Ритуальные символы',
    description: 'На полу — символы. Нажмите правильный орден.',
    roomId: 'lab',
    reward: 'Ключ от хранилища',
    solved: false,
    data: {
      grid: [
        ['☽', '✝', '⛤', '☠'],
        ['🔺', '⚗', '☿', '⚰'],
        ['💀', '🩸', '🕯', '⚡'],
        ['🌑', '⚔', '🗡', '🔮']
      ],
      solution: [['💀'], ['🕯'], ['☠'], ['⛤']],
      playerSequence: []
    }
  },
  {
    id: 'puzzle_math',
    type: 'math',
    title: 'Инвентаризация',
    description: 'Система хранения заблокирована. Нужно ввести верное число медикаментов.',
    roomId: 'storage',
    reward: 'Ключ от выхода',
    rewardKey: 'key_exit',
    solved: false,
    data: {
      question: 'В хранилище 144 ящика. Треть — пустые. Половина оставшихся — просрочена. Сколько годных?',
      answer: '48',
      options: ['36', '48', '72', '96'],
      correctOption: 1
    }
  },
  {
    id: 'puzzle_code2',
    type: 'code',
    title: 'Замок операционной',
    description: 'Последний барьер перед свободой.',
    roomId: 'operating',
    reward: 'Открыт выход',
    solved: false,
    data: {
      question: 'Слово из 6 букв — крик о помощи. Что кричат когда тонут?',
      answer: 'ПОМОЩЬ',
      options: []
    }
  }
];
