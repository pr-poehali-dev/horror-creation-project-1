import { Player } from '@/types/game';
import Icon from '@/components/ui/icon';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
}

const PlayerCard = ({ player, isActive }: PlayerCardProps) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const sanityPercent = player.sanity;
  const isP1 = player.id === 1;

  return (
    <div className={`border rounded p-3 transition-all duration-300 ${
      isActive
        ? `ring-2 ${isP1 ? 'ring-red-500 border-red-800' : 'ring-blue-500 border-blue-800'} bg-gray-900`
        : 'border-gray-800 bg-gray-950 opacity-70'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-horror ${isP1 ? 'player-1-indicator' : 'player-2-indicator'}`}>
            {isP1 ? '🔴' : '🔵'}
          </span>
          <span className={`font-horror text-sm ${isP1 ? 'text-red-400' : 'text-blue-400'}`}>
            {player.name}
          </span>
        </div>
        {isActive && (
          <span className="text-[10px] bg-yellow-900/60 text-yellow-400 px-1.5 py-0.5 rounded font-typewriter animate-pulse">
            ХОД
          </span>
        )}
        {!player.isAlive && (
          <span className="text-[10px] bg-red-900/60 text-red-400 px-1.5 py-0.5 rounded">☠ МЁРТВ</span>
        )}
      </div>

      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
            <span className="flex items-center gap-1"><Icon name="Heart" size={10} className="text-red-500" /> HP</span>
            <span className={`${player.hp < 30 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>{player.hp}/{player.maxHp}</span>
          </div>
          <div className="progress-horror h-2 rounded-full overflow-hidden">
            <div
              className="progress-horror-fill h-full rounded-full"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
            <span className="flex items-center gap-1"><Icon name="Brain" size={10} className="text-purple-500" /> Рассудок</span>
            <span className={`${player.sanity < 30 ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`}>{player.sanity}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-purple-950 border border-purple-900">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${sanityPercent}%`,
                background: sanityPercent > 60 ? '#7c3aed' : sanityPercent > 30 ? '#a855f7' : '#ec4899',
                boxShadow: `0 0 6px ${sanityPercent < 30 ? 'rgba(236,72,153,0.5)' : 'rgba(124,58,237,0.3)'}`
              }}
            />
          </div>
        </div>
      </div>

      {player.items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {player.items.map((item, i) => (
            <span key={i} className="text-[10px] bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded font-typewriter text-gray-400">
              {item === 'medkit' ? '💊 Аптечка' : `🔑 ${item}`}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 text-[9px] text-gray-600 font-typewriter">
        📍 {player.position}
      </div>
    </div>
  );
};

export default PlayerCard;
