import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw, MonitorX } from 'lucide-react';

type Point = [number, number];

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [[10, 10], [10, 11], [10, 12]];
const INITIAL_DIR: Point = [0, -1];
const TICK_RATE = 100; 

const TRACKS = [
  { id: 1, title: 'DATA.STREAM_01', artist: 'UNKNOWN_HOST', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'MEM_LEAK.WAV', artist: 'SYSOBJ_66', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 3, title: 'NULL_POINTER.MP3', artist: 'ROOT_ACCESS', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
];

const randomFood = (currentSnake: Point[]): Point => {
    let newFood: Point = [0, 0];
    let isOccupied = true;
    while (isOccupied) {
        newFood = [
            Math.floor(Math.random() * GRID_SIZE),
            Math.floor(Math.random() * GRID_SIZE)
        ];
        isOccupied = currentSnake.some(s => s[0] === newFood[0] && s[1] === newFood[1]);
    }
    return newFood;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>([15, 5]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const dirRef = useRef<Point>(INITIAL_DIR);
  const lastRenderedDirRef = useRef<Point>(INITIAL_DIR);
  const foodRef = useRef<Point>([15, 5]);

  // Music State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    dirRef.current = INITIAL_DIR;
    lastRenderedDirRef.current = INITIAL_DIR;
    setScore(0);
    setIsGameOver(false);
    foodRef.current = randomFood(INITIAL_SNAKE);
    setFood(foodRef.current);
    setIsGamePaused(false);
    setHasStarted(true);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
            if(e.target === document.body || e.target === document.documentElement) {
                 e.preventDefault();
            }
        }

        if (!hasStarted && e.key === 'Enter') {
            resetGame();
            return;
        }

        if (e.key === 'Escape' && hasStarted && !isGameOver) {
            setIsGamePaused(p => !p);
            return;
        }

        if (isGamePaused || isGameOver || !hasStarted) return;

        const [dx, dy] = lastRenderedDirRef.current;
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (dy !== 1) dirRef.current = [0, -1]; break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (dy !== -1) dirRef.current = [0, 1]; break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (dx !== 1) dirRef.current = [-1, 0]; break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (dx !== -1) dirRef.current = [1, 0]; break;
        }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGamePaused, isGameOver, hasStarted, resetGame]);

  // Game Loop
  useEffect(() => {
    if (isGameOver || isGamePaused || !hasStarted) return;

    const interval = setInterval(() => {
        setSnake(prev => {
            const head = prev[0];
            const curDir = dirRef.current;
            lastRenderedDirRef.current = curDir;
            
            const newHead: Point = [head[0] + curDir[0], head[1] + curDir[1]];

            if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
                setIsGameOver(true);
                return prev;
            }

            if (prev.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
                setIsGameOver(true);
                return prev;
            }

            const newSnake = [newHead, ...prev];
            
            if (newHead[0] === foodRef.current[0] && newHead[1] === foodRef.current[1]) {
                setScore(s => s + 10);
                foodRef.current = randomFood(newSnake);
                setFood(foodRef.current);
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [isGameOver, isGamePaused, hasStarted]);

  // Audio lifecycle
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  useEffect(() => {
      if (audioRef.current) {
          if (isPlayingMusic) {
              audioRef.current.play().catch(e => {
                  console.error("Audio block:", e);
                  setIsPlayingMusic(false);
              });
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlayingMusic, currentTrack]);

  const toggleMusic = () => {
     setIsPlayingMusic(!isPlayingMusic);
  };

  const skipForward = () => {
      setCurrentTrack(p => (p + 1) % TRACKS.length);
  };

  const skipBackward = () => {
      setCurrentTrack(p => (p - 1 + TRACKS.length) % TRACKS.length);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ffff] font-pixel selection:bg-[#ff00ff]/50 overflow-hidden flex flex-col relative select-none uppercase screen-tear">
        
        {/* Ambient Noise and Scanlines overlays */}
        <div className="absolute inset-0 static-noise z-40 pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 scanlines z-40 pointer-events-none opacity-40 mix-blend-multiply" />
        
        {/* Hidden Audio Element */}
        <audio 
            ref={audioRef} 
            src={TRACKS[currentTrack].url} 
            onEnded={skipForward} 
            preload="auto"
        />

        {/* Header */}
        <header className="flex-none p-4 sm:p-6 border-b-4 border-[#ff00ff] bg-black mb-4 relative z-10 flex w-full max-w-7xl mx-auto items-end justify-between shadow-[0_5px_0_#00ffff]">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter leading-none glitch-text rgb-split" data-text="SYS.SNAKE_ERR">SYS.SNAKE_ERR</h1>
              <p className="text-xs sm:text-sm tracking-[0.2em] mt-3 text-[#ff00ff]">&gt; NEURAL_LINK ESTABLISHED</p>
            </div>
            <div className="text-right border-r-4 border-[red] pr-4 flex flex-col justify-end">
              <p className="text-xs uppercase tracking-widest text-[#00ffff] opacity-80">&gt; ENTROPY</p>
              <p className="text-3xl sm:text-5xl leading-none rgb-split-reverse font-bold mt-1">{score.toString().padStart(5, '0')}</p>
            </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 pb-32">
            <div className="relative p-2 bg-[#ff00ff] w-full max-w-[min(100vw-2rem,500px)] aspect-square rotate-1 hover:rotate-0 transition-transform duration-200">
                
                {/* Game Grid Box */}
                <div className="w-full h-full bg-black border-4 border-[#00ffff] overflow-hidden relative shadow-[inset_0_0_20px_#ff00ff]">

                    {/* Game Grid Lines overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #ff00ff 1px, transparent 1px)',
                        backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`
                    }} />

                    {/* Snake Components */}
                    {snake.map((segment, i) => (
                        <div 
                            key={i}
                            className={`absolute transition-all duration-75 ${i % 2 === 0 ? 'bg-[#00ffff]' : 'bg-[#ff00ff]'}`}
                            style={{
                                width: `${100/GRID_SIZE}%`, height: `${100/GRID_SIZE}%`,
                                left: `${(segment[0]/GRID_SIZE)*100}%`, top: `${(segment[1]/GRID_SIZE)*100}%`,
                                border: i === 0 ? '2px solid white' : '2px solid black',
                                zIndex: i === 0 ? 10 : 5
                            }}
                        />
                    ))}

                    {/* Food Component */}
                    <div 
                        className="absolute bg-white shadow-[0_0_10px_#00ffff,0_0_20px_#ff00ff] animate-pulse"
                        style={{
                            width: `${100/GRID_SIZE}%`, height: `${100/GRID_SIZE}%`,
                            left: `${(food[0]/GRID_SIZE)*100}%`, top: `${(food[1]/GRID_SIZE)*100}%`,
                        }}
                    />

                    {/* In-Game HUD Overlays */}
                    {hasStarted && !isGameOver && (
                        <>
                            <div className="absolute top-2 left-2 text-xs bg-black/60 px-1 text-[#ff00ff] border-l-2 border-[#ff00ff]">X:{snake[0][0]} Y:{snake[0][1]}</div>
                            <div className="absolute bottom-2 right-2 text-xs bg-black/60 px-1 text-[#00ffff] border-l-2 border-[#00ffff] pointer-events-none">CLOCK:{Date.now().toString().slice(-4)}</div>
                        </>
                    )}

                    {/* Status Overlays */}
                    {!hasStarted && (
                         <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
                         <h2 className="text-2xl mb-8 text-[#ff00ff] animate-pulse rgb-split">&gt; INJECT PAYLOAD?</h2>
                         <button 
                             onClick={resetGame}
                             className="px-6 py-3 bg-[#00ffff] text-black text-xl font-bold border-4 border-[#ff00ff] hover:bg-[#ff00ff] hover:border-[#00ffff] transition-colors hover:text-white cursor-pointer"
                         >
                             EXECUTE_DIR // BOOT
                         </button>
                         <p className="mt-8 text-white/50 text-sm rgb-split-reverse">AWAITING ENTER KEY SIGNAL</p>
                         <div className="mt-4 border-t border-dashed border-[#00ffff]/50 pt-4 w-3/4 text-center">
                             <p className="text-[#00ffff]/70 text-xs leading-relaxed tracking-widest">INPUT_VECTORS:<br/>[W.A.S.D] OR [ARROWS]<br/>[ESC] FOR HALT</p>
                         </div>
                     </div>
                    )}

                    {isGameOver && hasStarted && (
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ff00ff,#ff00ff_10px,transparent_10px,transparent_20px)] bg-opacity-20 flex flex-col items-center justify-center z-20 mix-blend-difference">
                            <div className="bg-black border-4 border-[#ff00ff] p-6 text-center shadow-[0_0_40px_#ff00ff]">
                                <MonitorX className="w-12 h-12 text-[red] mx-auto mb-4 animate-bounce" />
                                <h2 className="text-3xl font-black text-[red] mb-2 glitch-text rgb-split-reverse" data-text="SECTOR CORRUPT">SECTOR CORRUPT</h2>
                                <p className="text-[#00ffff] mb-6 text-xl bg-[#ff00ff]/20 px-2 py-1">LEAK VOLUME: {score}</p>
                                <button 
                                    onClick={resetGame}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold uppercase hover:bg-[red] hover:text-white transition-colors border-2 border-[red] cursor-pointer"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    RE-COMPILE
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {!isGameOver && isGamePaused && hasStarted && (
                        <div className="absolute inset-0 bg-[#00ffff]/20 backdrop-invert flex flex-col items-center justify-center z-20">
                            <div className="bg-black border-[6px] border-[#ff00ff] p-6">
                                <h2 className="text-4xl font-black text-white tracking-[0.2em] glitch-text rgb-split" data-text="HALTED">HALTED</h2>
                                <p className="mt-4 text-[#00ffff] text-sm animate-pulse text-center">&gt; AWAITING INPUT</p>
                                <button 
                                    onClick={() => setIsGamePaused(false)}
                                    className="mt-6 w-full px-4 py-2 border-2 border-white bg-[#ff00ff] text-white text-sm hover:bg-black transition-all cursor-pointer"
                                >
                                    RESUME_OP()
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>

        {/* Music Player Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-4 border-[#00ffff] p-4 shadow-[0_-5px_0_#ff00ff] screen-tear" style={{ animationDelay: '1s', animationDuration: '6s' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-7xl mx-auto">
                
                {/* Track Info */}
                <div className="w-full sm:w-1/3 flex border-l-4 border-[#ff00ff] pl-4">
                    <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-[10px] uppercase text-[#00ffff]/70 mb-1">&gt; AUD_STREAMING</p>
                        <p className="text-lg font-bold truncate text-[#ff00ff] rgb-split-reverse">{TRACKS[currentTrack].title}</p>
                        <p className="text-xs truncate text-[#00ffff]">{TRACKS[currentTrack].artist}</p>
                    </div>
                </div>
                
                {/* Main Controls */}
                <div className="flex-1 flex flex-col gap-3 w-full items-center justify-center py-2 sm:py-0 border-y-2 sm:border-y-0 sm:border-x-2 border-dashed border-[#00ffff]/30">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={skipBackward} 
                            className="text-[#00ffff] hover:text-[#ff00ff] hover:-translate-x-1 transition-all cursor-pointer"
                        >
                            <SkipBack className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={toggleMusic} 
                            className="w-14 h-14 bg-[#ff00ff] text-black border-4 border-[#00ffff] flex items-center justify-center hover:bg-white hover:border-[#ff00ff] transition-colors cursor-pointer shadow-[2px_2px_0_#00ffff]"
                        >
                            {isPlayingMusic ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
                        </button>
                        <button 
                            onClick={skipForward} 
                            className="text-[#00ffff] hover:text-[#00ffff] hover:translate-x-1 transition-all cursor-pointer"
                        >
                            <SkipForward className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Volume Options & Pause Game */}
                <div className="w-full sm:w-1/3 flex flex-row items-center justify-between sm:justify-end gap-6 text-[#00ffff]">
                    <button 
                        onClick={() => hasStarted && !isGameOver && setIsGamePaused(p => !p)}
                        className={`text-xs px-2 py-1 border-2 border-dashed transition-colors cursor-pointer ${
                            hasStarted && !isGameOver 
                                ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black' 
                                : 'border-[#00ffff]/30 text-[#00ffff]/30 cursor-not-allowed'
                        }`}
                        disabled={!hasStarted || isGameOver}
                    >
                        {isGamePaused ? '&gt; CONTINUE' : '&gt; SUSPEND'}
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs">&gt; VOL</span>
                        <div className="w-20 h-2 bg-black border border-[#00ffff] relative overflow-hidden flex items-center cursor-pointer" 
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const ratio = (e.clientX - rect.left) / rect.width;
                                setVolume(Math.max(0, Math.min(1, ratio)));
                            }}
                        >
                            <div className="absolute top-0 left-0 h-full bg-[#ff00ff]" style={{ width: `${volume * 100}%` }}></div>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    </div>
  );
}
