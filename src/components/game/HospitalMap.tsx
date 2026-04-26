import { Room, Player } from '@/types/game';

interface HospitalMapProps {
  rooms: Room[];
  currentRoom: string;
  players: [Player, Player];
  grannyPosition: string;
  onRoomClick: (roomId: string) => void;
}

const HospitalMap = ({ rooms, currentRoom, players, grannyPosition, onRoomClick }: HospitalMapProps) => {
  const minX = Math.min(...rooms.map(r => r.x));
  const minY = Math.min(...rooms.map(r => r.y));
  const maxX = Math.max(...rooms.map(r => r.x));
  const maxY = Math.max(...rooms.map(r => r.y));

  const gridW = maxX - minX + 1;
  const gridH = maxY - minY + 1;

  const getRoomClass = (room: Room) => {
    if (room.id === currentRoom) return 'ring-2 ring-yellow-400 bg-yellow-900/30 cursor-pointer';
    if (room.isLocked && !room.isCompleted) return 'room-locked opacity-60';
    if (room.isCompleted) return 'room-completed';
    if (room.isDanger) return 'room-danger cursor-pointer';
    return 'room-available';
  };

  const isAdjacent = (roomId: string) => {
    const current = rooms.find(r => r.id === currentRoom);
    return current?.connections.includes(roomId) ?? false;
  };

  const getConnections = () => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    const CELL = 80;
    const HALF = CELL / 2;

    rooms.forEach(room => {
      room.connections.forEach(connId => {
        const connRoom = rooms.find(r => r.id === connId);
        if (!connRoom) return;
        if (room.id < connId) {
          const x1 = (room.x - minX) * CELL + HALF;
          const y1 = (maxY - room.y) * CELL + HALF;
          const x2 = (connRoom.x - minX) * CELL + HALF;
          const y2 = (maxY - connRoom.y) * CELL + HALF;
          lines.push({ x1, y1, x2, y2, key: `${room.id}-${connId}` });
        }
      });
    });
    return lines;
  };

  const CELL = 80;

  return (
    <div className="relative overflow-auto">
      <svg
        width={gridW * CELL}
        height={gridH * CELL}
        className="absolute inset-0 pointer-events-none z-0"
      >
        {getConnections().map(line => (
          <line
            key={line.key}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#333"
            strokeWidth={2}
            strokeDasharray="4,3"
          />
        ))}
      </svg>

      <div
        className="relative"
        style={{ width: gridW * CELL, height: gridH * CELL }}
      >
        {rooms.map(room => {
          const px = (room.x - minX) * CELL;
          const py = (maxY - room.y) * CELL;
          const adj = isAdjacent(room.id);
          const isCurrent = room.id === currentRoom;
          const hasGranny = grannyPosition === room.id;

          return (
            <div
              key={room.id}
              className={`absolute z-10 w-16 h-16 rounded flex flex-col items-center justify-center text-center border transition-all duration-200 select-none
                ${getRoomClass(room)}
                ${adj && !isCurrent ? 'cursor-pointer hover:scale-105 ring-1 ring-green-600/50' : ''}
                ${hasGranny ? 'ring-2 ring-red-500 animate-pulse' : ''}
              `}
              style={{ left: px + 8, top: py + 8, width: 60, height: 60 }}
              onClick={() => (adj || isCurrent) && onRoomClick(room.id)}
              title={room.name}
            >
              <div className="text-xl leading-none">{hasGranny ? '👵' : room.icon}</div>
              <div className="text-[8px] font-typewriter text-gray-400 leading-tight px-0.5 text-center">
                {room.name}
              </div>
              {room.isLocked && !room.isCompleted && (
                <div className="text-[9px]">🔒</div>
              )}
              {room.puzzleId && !room.isCompleted && !room.isLocked && (
                <div className="text-[8px] text-yellow-500">!</div>
              )}
              {players[0].position === room.id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-red-300 text-[6px] flex items-center justify-center text-white">1</div>
              )}
              {players[1].position === room.id && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-blue-300 text-[6px] flex items-center justify-center text-white">2</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs font-typewriter">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-900/50 ring-1 ring-yellow-400 inline-block"></span> Текущая</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a2e1a] border border-green-800 inline-block"></span> Доступна</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#2a0a0a] border border-red-900 inline-block"></span> Опасно</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a1a1a] border border-gray-700 inline-block"></span> Закрыта</span>
      </div>
    </div>
  );
};

export default HospitalMap;
