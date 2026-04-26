import { useState, useEffect } from 'react';
import { Puzzle, Player } from '@/types/game';
import Icon from '@/components/ui/icon';

interface PuzzleModalProps {
  puzzle: Puzzle;
  player: Player;
  onSolve: (puzzleId: string) => void;
  onFail: (damage: number, sanityDamage: number) => void;
  onClose: () => void;
}

const PuzzleModal = ({ puzzle, player, onSolve, onFail, onClose }: PuzzleModalProps) => {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [wireState, setWireState] = useState<Record<string, string>>({});
  const [selectedWireFrom, setSelectedWireFrom] = useState<string | null>(null);
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'input'>('show');
  const [memoryInput, setMemoryInput] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [showSequence, setShowSequence] = useState(true);

  const maxAttempts = 3;
  const isP1 = player.id === 1;

  useEffect(() => {
    if (puzzle.type === 'memory' && showSequence) {
      const t = setTimeout(() => {
        setShowSequence(false);
        setMemoryPhase('input');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [puzzle.type, showSequence]);

  const handleCodeSubmit = () => {
    const correct =
      answer.trim().toUpperCase() === String(puzzle.data.answer).toUpperCase();
    if (correct) {
      setFeedback('correct');
      setTimeout(() => onSolve(puzzle.id), 800);
    } else {
      setFeedback('wrong');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setTimeout(() => setFeedback('idle'), 600);
      if (newAttempts >= maxAttempts) {
        setTimeout(() => onFail(20, 15), 800);
      }
    }
  };

  const handleOptionSelect = (idx: number) => {
    setSelectedOption(idx);
    if (idx === puzzle.data.correctOption) {
      setFeedback('correct');
      setTimeout(() => onSolve(puzzle.id), 800);
    } else {
      setFeedback('wrong');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setTimeout(() => { setFeedback('idle'); setSelectedOption(null); }, 700);
      if (newAttempts >= maxAttempts) setTimeout(() => onFail(20, 15), 800);
    }
  };

  const handleWireClick = (type: 'from' | 'to', id: string) => {
    if (type === 'from') {
      setSelectedWireFrom(id);
    } else if (selectedWireFrom) {
      const wire = puzzle.data.wires?.find(w => w.from === selectedWireFrom && w.to === id);
      if (wire) {
        const newState = { ...wireState, [selectedWireFrom]: id };
        setWireState(newState);
        setSelectedWireFrom(null);
        const allWires = puzzle.data.wires ?? [];
        const allConnected = allWires.every(w => newState[w.from] === w.to);
        if (allConnected) {
          setFeedback('correct');
          setTimeout(() => onSolve(puzzle.id), 800);
        }
      } else {
        setFeedback('wrong');
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setTimeout(() => setFeedback('idle'), 600);
        setSelectedWireFrom(null);
        if (newAttempts >= maxAttempts) setTimeout(() => onFail(20, 15), 800);
      }
    }
  };

  const handleMemorySymbol = (sym: string) => {
    const newInput = [...memoryInput, sym];
    setMemoryInput(newInput);
    const seq = puzzle.data.sequence ?? [];
    if (newInput.length === seq.length) {
      const correct = newInput.every((s, i) => s === seq[i]);
      if (correct) {
        setFeedback('correct');
        setTimeout(() => onSolve(puzzle.id), 800);
      } else {
        setFeedback('wrong');
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setTimeout(() => { setFeedback('idle'); setMemoryInput([]); }, 700);
        if (newAttempts >= maxAttempts) setTimeout(() => onFail(20, 15), 800);
      }
    }
  };

  const handleSymbolClick = (sym: string) => {
    const solution = (puzzle.data.solution ?? []).flat();
    const newInput = [...symbolInput, sym];
    setSymbolInput(newInput);
    if (newInput.length === solution.length) {
      const correct = newInput.every((s, i) => s === solution[i]);
      if (correct) {
        setFeedback('correct');
        setTimeout(() => onSolve(puzzle.id), 800);
      } else {
        setFeedback('wrong');
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setTimeout(() => { setFeedback('idle'); setSymbolInput([]); }, 700);
        if (newAttempts >= maxAttempts) setTimeout(() => onFail(20, 15), 800);
      }
    }
  };

  const borderColor = isP1 ? 'border-red-800' : 'border-blue-800';
  const accentColor = isP1 ? 'text-red-400' : 'text-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={`relative max-w-lg w-full mx-4 bg-gray-950 border ${borderColor} rounded-lg shadow-2xl overflow-hidden scanlines`}
        style={{ boxShadow: isP1 ? '0 0 30px rgba(139,0,0,0.3)' : '0 0 30px rgba(0,68,204,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          <div>
            <div className={`font-horror text-lg ${accentColor}`}>{puzzle.title}</div>
            <div className="text-[10px] font-typewriter text-gray-500">
              Игрок {player.id}: {player.name} | Попытки: {attempts}/{maxAttempts}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-red-400 transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="px-4 py-3 bg-gray-900/50">
          <p className="font-typewriter text-sm text-gray-300 leading-relaxed">{puzzle.description}</p>
          {puzzle.reward && (
            <div className="mt-2 text-[11px] text-yellow-600 font-typewriter">
              🏆 Награда: {puzzle.reward}
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback !== 'idle' && (
          <div className={`px-4 py-2 text-center font-horror text-sm ${feedback === 'correct' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400 shake'}`}>
            {feedback === 'correct' ? '✓ ВЕРНО! Замок открыт...' : '✗ НЕВЕРНО! Шум привлёк внимание...'}
          </div>
        )}

        {/* Puzzle content */}
        <div className="px-4 py-4">
          {/* CODE puzzle */}
          {(puzzle.type === 'code') && (
            <div className="space-y-3">
              <p className="text-xs font-typewriter text-gray-400">{puzzle.data.question}</p>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                placeholder="Введите ответ..."
                maxLength={20}
                className="w-full input-horror rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleCodeSubmit}
                disabled={!answer.trim()}
                className="w-full btn-horror px-4 py-2 rounded text-sm disabled:opacity-40"
              >
                Подтвердить
              </button>
            </div>
          )}

          {/* OPTIONS (medicine/math) */}
          {(puzzle.type === 'medicine' || puzzle.type === 'math') && puzzle.data.options && (
            <div className="space-y-3">
              <p className="text-xs font-typewriter text-gray-300">{puzzle.data.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {puzzle.data.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`btn-horror px-3 py-2 rounded text-sm font-typewriter transition-all
                      ${selectedOption === idx && feedback === 'wrong' ? 'border-red-500 bg-red-950' : ''}
                      ${selectedOption === idx && feedback === 'correct' ? 'border-green-500 bg-green-950' : ''}
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MEMORY puzzle */}
          {puzzle.type === 'memory' && (
            <div className="space-y-3">
              {memoryPhase === 'show' || showSequence ? (
                <div className="text-center">
                  <p className="text-xs font-typewriter text-gray-400 mb-3">Запомните последовательность! (4 сек)</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {(puzzle.data.sequence ?? []).map((sym, i) => (
                      <div key={i} className="w-10 h-10 flex items-center justify-center text-2xl bg-gray-800 border border-gray-700 rounded">
                        {sym}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-typewriter text-gray-400 mb-2">
                    Повторите порядок ({memoryInput.length}/{(puzzle.data.sequence ?? []).length}):
                  </p>
                  <div className="flex gap-1 mb-3 min-h-10 flex-wrap">
                    {memoryInput.map((sym, i) => (
                      <div key={i} className="w-9 h-9 flex items-center justify-center text-xl bg-gray-800 border border-gray-700 rounded">
                        {sym}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['☠', '🩸', '💊', '🔪', '👁', '🕯'].map(sym => (
                      <button
                        key={sym}
                        onClick={() => handleMemorySymbol(sym)}
                        className="w-11 h-11 text-2xl bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-red-700 rounded transition-all"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setMemoryInput([])} className="mt-2 text-xs text-gray-600 hover:text-red-400 font-typewriter">
                    Сбросить
                  </button>
                </div>
              )}
            </div>
          )}

          {/* WIRE puzzle */}
          {puzzle.type === 'wire' && (
            <div className="space-y-3">
              <p className="text-xs font-typewriter text-gray-400">Соедините провода (нажмите левый, затем правый)</p>
              <div className="flex justify-between items-center gap-4">
                <div className="flex flex-col gap-3">
                  {(puzzle.data.wires ?? []).map(wire => (
                    <button
                      key={wire.from}
                      onClick={() => handleWireClick('from', wire.from)}
                      className={`w-16 h-8 rounded text-xs font-typewriter border transition-all
                        ${selectedWireFrom === wire.from ? 'scale-110' : ''}
                        ${wireState[wire.from] ? 'opacity-50' : 'hover:scale-105'}
                      `}
                      style={{
                        background: wire.color + '33',
                        borderColor: wire.color,
                        color: wire.color,
                        boxShadow: selectedWireFrom === wire.from ? `0 0 10px ${wire.color}` : 'none'
                      }}
                    >
                      {wire.from} ——
                    </button>
                  ))}
                </div>
                <div className="text-gray-600 text-xs font-typewriter flex flex-col gap-3">
                  {(puzzle.data.wires ?? []).map(wire => (
                    <div key={wire.from} className="text-center">
                      {wireState[wire.from] ? (
                        <span style={{ color: wire.color }}>✓</span>
                      ) : (
                        <span>~</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {['1', '2', '3', '4'].map(id => (
                    <button
                      key={id}
                      onClick={() => handleWireClick('to', id)}
                      className="w-16 h-8 rounded text-xs font-typewriter border border-gray-600 bg-gray-800 hover:border-gray-400 hover:bg-gray-700 transition-all"
                    >
                      —— {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SYMBOL puzzle */}
          {puzzle.type === 'symbol' && (
            <div className="space-y-3">
              <p className="text-xs font-typewriter text-gray-400">
                Нажмите символы в правильном порядке: {(puzzle.data.solution ?? []).flat().join(' → ')}
              </p>
              <div className="flex gap-1 mb-2 min-h-8">
                {symbolInput.map((sym, i) => (
                  <span key={i} className="text-lg">{sym}</span>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(puzzle.data.grid ?? []).flat().map((sym, i) => (
                  <button
                    key={i}
                    onClick={() => handleSymbolClick(sym)}
                    className="puzzle-cell rounded text-lg"
                    title={sym}
                  >
                    {sym}
                  </button>
                ))}
              </div>
              <button onClick={() => setSymbolInput([])} className="text-xs text-gray-600 hover:text-red-400 font-typewriter">
                Сбросить
              </button>
            </div>
          )}
        </div>

        {/* Attempts warning */}
        {attempts > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-1">
              {Array.from({ length: maxAttempts }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded ${i < attempts ? 'bg-red-600' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleModal;
