import { useState } from 'react';
import Game3D from '@/components/game/Game3D';

const Index = () => {
  const [started, setStarted] = useState(false);
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [flickerClass] = useState('');

  if (started) {
    return (
      <Game3D
        player1Name={p1Name}
        player2Name={p2Name}
        onExit={() => setStarted(false)}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center relative overflow-hidden ${flickerClass}`}
      style={{ background: 'radial-gradient(ellipse at center, #0a0005 0%, #000 70%)' }}>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#1a0000 39px,#1a0000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#1a0000 39px,#1a0000 40px)' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.9) 100%)' }} />

      <div className="relative z-10 text-center px-4 max-w-md w-full">
        <div className="text-7xl mb-4 float-anim">🏥</div>

        <h1 className="font-horror text-6xl mb-1 flicker"
          style={{ color: '#cc0000', textShadow: '0 0 30px #8b0000, 0 0 60px #4a0000, 0 0 2px #fff' }}>
          ПАЛАТА 13
        </h1>
        <p className="font-typewriter text-gray-600 text-xs tracking-widest mb-1 uppercase">
          3D Хоррор — Вид от первого лица
        </p>
        <p className="font-typewriter text-gray-700 text-[10px] tracking-wider mb-8">
          Мультиплеер на 2 игроков · Головоломки · Грани охотится
        </p>

        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-5 mb-5 space-y-3 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-typewriter text-red-400 tracking-widest uppercase">Игрок 1 (красный)</label>
            <input type="text" value={p1Name} onChange={e => setP1Name(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setStarted(true)}
              placeholder="Имя первого выжившего..." maxLength={20}
              className="w-full input-horror rounded-lg px-3 py-2 text-sm border border-red-950 focus:border-red-700 focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-typewriter text-blue-400 tracking-widest uppercase">Игрок 2 (синий)</label>
            <input type="text" value={p2Name} onChange={e => setP2Name(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setStarted(true)}
              placeholder="Имя второго выжившего..." maxLength={20}
              className="w-full input-horror rounded-lg px-3 py-2 text-sm border border-blue-950 focus:border-blue-700 focus:outline-none" />
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="btn-horror w-full py-3 rounded-xl font-horror text-xl tracking-wider mb-6"
        >
          ВОЙТИ В БОЛЬНИЦУ
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '🕹', title: 'WASD', sub: 'Движение' },
            { icon: '🖱', title: 'Мышь', sub: 'Поворот' },
            { icon: '⌨', title: '[E]', sub: 'Взаимодействие' },
          ].map(x => (
            <div key={x.icon} className="bg-gray-950 border border-gray-800 rounded-lg p-2 text-center">
              <div className="text-xl mb-1">{x.icon}</div>
              <div className="text-[10px] font-horror text-gray-400">{x.title}</div>
              <div className="text-[9px] font-typewriter text-gray-700">{x.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🗺', title: 'Больница', sub: '3D коридоры' },
            { icon: '🧩', title: 'Загадки', sub: '5 головоломок' },
            { icon: '👵', title: 'Грани', sub: 'Охотится на вас' },
          ].map(x => (
            <div key={x.icon} className="bg-gray-950 border border-gray-800 rounded-lg p-2 text-center">
              <div className="text-xl mb-1">{x.icon}</div>
              <div className="text-[10px] font-horror text-gray-500">{x.title}</div>
              <div className="text-[9px] font-typewriter text-gray-700">{x.sub}</div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-typewriter text-gray-700">
          Ходы чередуются. Оба игрока должны добраться до аварийного выхода.
        </p>
      </div>
    </div>
  );
};

export default Index;
