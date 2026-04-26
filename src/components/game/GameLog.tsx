import { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: string[];
}

const GameLog = ({ logs }: GameLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-28 overflow-y-auto bg-black border border-gray-800 rounded p-2 space-y-0.5">
      {logs.length === 0 && (
        <p className="text-gray-700 text-xs font-typewriter italic">Журнал событий пуст...</p>
      )}
      {logs.map((log, i) => (
        <div
          key={i}
          className={`text-[11px] font-typewriter leading-tight ${
            log.startsWith('⚠') ? 'text-red-400' :
            log.startsWith('✓') ? 'text-green-400' :
            log.startsWith('👵') ? 'text-red-500 font-bold' :
            log.startsWith('💀') ? 'text-red-600' :
            log.startsWith('🔑') ? 'text-yellow-400' :
            log.startsWith('💊') ? 'text-green-400' :
            log.startsWith('🧩') ? 'text-blue-400' :
            'text-gray-500'
          }`}
        >
          <span className="text-gray-700 mr-1">[{i + 1}]</span>
          {log}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default GameLog;
