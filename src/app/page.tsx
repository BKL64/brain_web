"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────── TYPES ─────────────── */
type Screen = "welcome" | "countdown" | "memorize" | "input" | "result";

interface RoundResult {
  level: number;
  correct: number;
  total: number;
  avgSpeed: number; // ms per correct click
}

/* ─────────────── CONSTANTS ─────────────── */
const GRID_SIZE = 16;
const TOTAL_ROUNDS = 5;
const MEMORIZE_TIME = 1200; // ms
const NUMBERS_PER_ROUND = [6, 6, 7, 8, 9];

/* ─────────────── HELPERS ─────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound(numCount: number) {
  const positions = shuffle(Array.from({ length: GRID_SIZE }, (_, i) => i)).slice(0, numCount);
  const numbers: Map<number, number> = new Map();
  positions.forEach((pos, idx) => {
    numbers.set(pos, idx + 1);
  });
  return { positions, numbers, order: positions.map((_, i) => i + 1) };
}

function calculateBrainAge(results: RoundResult[]): number {
  // Scoring: weighted toward flattering results (19-26)
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalPossible = results.reduce((s, r) => s + r.total, 0);
  const accuracy = totalCorrect / totalPossible;

  const avgSpeed = results.reduce((s, r) => s + r.avgSpeed, 0) / results.length;

  // Base age starts at 28, gets reduced by good performance
  let brainAge = 28;

  // Accuracy bonus: up to -8 years
  brainAge -= accuracy * 8;

  // Speed bonus: faster than 800ms starts cutting more
  if (avgSpeed < 600) brainAge -= 3;
  else if (avgSpeed < 800) brainAge -= 2;
  else if (avgSpeed < 1000) brainAge -= 1;
  else if (avgSpeed > 1500) brainAge += 2;
  else if (avgSpeed > 2000) brainAge += 4;

  // Level progression bonus
  const maxLevel = Math.max(...results.map((r) => r.level));
  if (maxLevel >= 5) brainAge -= 1;

  // Gentle random nudge (±1) for variation
  brainAge += (Math.random() - 0.5) * 2;

  // Clamp to 18-32 range, biased heavily toward 19-26
  brainAge = Math.round(Math.max(18, Math.min(32, brainAge)));

  // Extra bias: if result is > 26, 60% chance to pull it down
  if (brainAge > 26 && Math.random() < 0.6) {
    brainAge = Math.floor(Math.random() * 4) + 22; // 22-25
  }

  return brainAge;
}

function shareScore(brainAge: number) {
  const text = `🧠⚡ NEURAL SCANNER — Brain Age Test\n\nMon cerveau a ${brainAge} ans !\nEt toi, quel âge a ton cerveau ?\n\n🔬 Fais le test → `;
  const url = typeof window !== "undefined" ? window.location.href : "";

  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ title: "Neural Scanner", text, url }).catch(() => {
      copyToClipboard(text + url);
    });
  } else {
    copyToClipboard(text + url);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Résultat copié ! Partage-le à tes amis 🧠");
  });
}

function shareWhatsApp(brainAge: number) {
  const text = encodeURIComponent(
    `🧠⚡ NEURAL SCANNER\nMon cerveau a ${brainAge} ans ! Et toi ?\n🔬 Fais le test → ${typeof window !== "undefined" ? window.location.href : ""}`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

function shareX(brainAge: number) {
  const text = encodeURIComponent(
    `🧠⚡ Mon cerveau a ${brainAge} ans d'après le Neural Scanner ! Et toi ? 🔬`
  );
  const url = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
}

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function NeuralScanner() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState<Map<number, number>>(new Map());
  const [activePositions, setActivePositions] = useState<number[]>([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [clickedCells, setClickedCells] = useState<Set<number>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [shockwaveCells, setShockwaveCells] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<RoundResult[]>([]);
  const [brainAge, setBrainAge] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [roundClickTimes, setRoundClickTimes] = useState<number[]>([]);

  const lastClickTime = useRef<number>(0);
  const roundCorrectCount = useRef<number>(0);

  /* ── Start a new game ── */
  const startGame = useCallback(() => {
    setResults([]);
    setRound(0);
    setBrainAge(null);
    setScreen("countdown");
    setCountdown(3);
  }, []);

  /* ── Countdown ── */
  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) {
      startRound(0);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, countdown]);

  /* ── Start a specific round ── */
  const startRound = useCallback(
    (roundIdx: number) => {
      const numCount = NUMBERS_PER_ROUND[roundIdx] ?? 9;
      const { numbers } = generateRound(numCount);
      setRound(roundIdx);
      setGrid(numbers);
      setActivePositions(Array.from(numbers.keys()));
      setNextExpected(1);
      setClickedCells(new Set());
      setCorrectCells(new Set());
      setWrongCell(null);
      setShockwaveCells(new Set());
      setRoundClickTimes([]);
      roundCorrectCount.current = 0;
      lastClickTime.current = Date.now();
      setScreen("memorize");

      // After memorization time, switch to input
      setTimeout(() => {
        setScreen("input");
        lastClickTime.current = Date.now();
      }, MEMORIZE_TIME);
    },
    []
  );

  /* ── Handle cell click during input ── */
  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (screen !== "input") return;
      if (clickedCells.has(cellIndex)) return;
      if (!grid.has(cellIndex)) return;

      const cellValue = grid.get(cellIndex)!;
      const now = Date.now();
      const clickSpeed = now - lastClickTime.current;
      lastClickTime.current = now;

      if (cellValue === nextExpected) {
        // Correct!
        roundCorrectCount.current += 1;
        setRoundClickTimes((prev) => [...prev, clickSpeed]);
        setClickedCells((prev) => new Set(prev).add(cellIndex));
        setCorrectCells((prev) => new Set(prev).add(cellIndex));
        setShockwaveCells((prev) => new Set(prev).add(cellIndex));
        setTimeout(() => {
          setShockwaveCells((prev) => {
            const next = new Set(prev);
            next.delete(cellIndex);
            return next;
          });
        }, 500);
        setNextExpected((prev) => prev + 1);

        // Check if round complete
        if (cellValue === grid.size) {
          const allTimes = [...roundClickTimes, clickSpeed];
          const avgSpeed = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b) / allTimes.length : 999;
          const result: RoundResult = {
            level: round + 1,
            correct: roundCorrectCount.current,
            total: grid.size,
            avgSpeed,
          };
          const newResults = [...results, result];
          setResults(newResults);

          if (round + 1 >= TOTAL_ROUNDS) {
            // Game over — show results
            const age = calculateBrainAge(newResults);
            setBrainAge(age);
            setTimeout(() => setScreen("result"), 600);
          } else {
            // Next round after brief pause
            setTimeout(() => {
              setScreen("countdown");
              setCountdown(2);
              setTimeout(() => startRound(round + 1), 2000);
            }, 500);
          }
        }
      } else {
        // Wrong!
        setWrongCell(cellIndex);
        setTimeout(() => setWrongCell(null), 500);

        // End round on error
        const allTimes = [...roundClickTimes];
        const avgSpeed = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b) / allTimes.length : 2000;
        const result: RoundResult = {
          level: round + 1,
          correct: roundCorrectCount.current,
          total: grid.size,
          avgSpeed,
        };
        const newResults = [...results, result];
        setResults(newResults);

        if (round + 1 >= TOTAL_ROUNDS) {
          const age = calculateBrainAge(newResults);
          setBrainAge(age);
          setTimeout(() => setScreen("result"), 800);
        } else {
          setTimeout(() => {
            startRound(round + 1);
          }, 800);
        }
      }
    },
    [screen, clickedCells, grid, nextExpected, roundClickTimes, round, results, startRound]
  );

  /* ── Get age text color ── */
  const getAgeColor = (age: number) => {
    if (age <= 20) return "text-emerald-400";
    if (age <= 24) return "text-green-400";
    if (age <= 27) return "text-yellow-400";
    return "text-orange-400";
  };

  const getAgeLabel = (age: number) => {
    if (age <= 20) return "🏆 Génie absolu !";
    if (age <= 23) return "⚡ Cerveau surpuissant";
    if (age <= 26) return "✨ Excellente mémoire";
    if (age <= 29) return "🧠 Dans la moyenne";
    return "💪 Tu peux t'améliorer";
  };

  /* ─────────────── WELCOME SCREEN ─────────────── */
  if (screen === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-fade-in-up max-w-lg mx-auto">
        {/* Decorative rings */}
        <div className="relative mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-violet-500/30 animate-border-glow flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-indigo-400/20 flex items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center">
                <span className="text-3xl md:text-4xl">🧠</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="font-sans text-3xl md:text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
          NEURAL SCANNER
        </h1>
        <p className="font-mono text-sm md:text-base text-violet-400/80 tracking-widest uppercase mb-8">
          Brain Age Test
        </p>

        <div className="glass rounded-2xl p-6 md:p-8 mb-8 max-w-sm w-full">
          <p className="font-mono text-xs md:text-sm text-violet-300/70 leading-relaxed">
            <span className="text-violet-400">{">"}</span> Mémorise les chiffres.
            <br />
            <span className="text-violet-400">{">"}</span> Clique dans l&apos;ordre.
            <br />
            <span className="text-violet-400">{">"}</span> Découvre l&apos;âge de ton cerveau.
          </p>
        </div>

        <button
          onClick={startGame}
          className="group relative px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl font-sans font-bold text-lg text-white animate-pulse-glow transition-all duration-300 hover:from-violet-500 hover:to-indigo-500 active:scale-95 cursor-pointer"
        >
          <span className="relative z-10 flex items-center gap-3">
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            INITIER LE SCAN
          </span>
        </button>

        <p className="mt-6 font-mono text-[10px] md:text-xs text-violet-400/40 tracking-wider">
          v2.1.0 — Powered by Neural AI
        </p>
      </div>
    );
  }

  /* ─────────────── COUNTDOWN SCREEN ─────────────── */
  if (screen === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <p className="font-mono text-sm text-violet-400/80 tracking-widest uppercase mb-4">
          Round {round + 1} / {TOTAL_ROUNDS}
        </p>
        <div className="relative">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full glass-strong flex items-center justify-center animate-border-glow">
            <span
              key={countdown}
              className="font-sans text-5xl md:text-7xl font-black text-violet-300 animate-count-up"
            >
              {countdown > 0 ? countdown : "GO"}
            </span>
          </div>
        </div>
        <p className="font-mono text-xs text-violet-400/50 mt-6">
          Prépare-toi à mémoriser...
        </p>
      </div>
    );
  }

  /* ─────────────── RESULT SCREEN ─────────────── */
  if (screen === "result" && brainAge !== null) {
    const accuracy = results.reduce((s, r) => s + r.correct, 0) / results.reduce((s, r) => s + r.total, 0);

    return (
      <div className="flex flex-col items-center text-center animate-fade-in-up max-w-md mx-auto w-full px-2">
        <p className="font-mono text-xs md:text-sm text-violet-400/80 tracking-widest uppercase mb-6">
          ── Analyse Complète ──
        </p>

        {/* Main result card */}
        <div className="glass-strong rounded-3xl p-6 md:p-8 mb-6 w-full">
          <p className="font-mono text-xs text-violet-400/60 mb-2">ÂGE CÉRÉBRAL ESTIMÉ</p>
          <div className="flex items-end justify-center gap-1 mb-3">
            <span className={`font-sans text-6xl md:text-8xl font-black ${getAgeColor(brainAge)} animate-count-up`}>
              {brainAge}
            </span>
            <span className="font-sans text-2xl md:text-3xl font-bold text-violet-300/60 mb-2">ans</span>
          </div>
          <p className="font-mono text-sm md:text-base text-violet-300/80">{getAgeLabel(brainAge)}</p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="glass rounded-xl p-3">
              <p className="font-mono text-[10px] text-violet-400/50 uppercase">Précision</p>
              <p className="font-sans text-xl font-bold text-violet-200">{Math.round(accuracy * 100)}%</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="font-mono text-[10px] text-violet-400/50 uppercase">Rounds</p>
              <p className="font-sans text-xl font-bold text-violet-200">{TOTAL_ROUNDS}/{TOTAL_ROUNDS}</p>
            </div>
          </div>
        </div>

        {/* AdSense 300x250 placeholder */}
        <div className="glass rounded-lg flex items-center justify-center text-violet-400/30 font-mono text-xs mb-6"
          style={{ width: '300px', maxWidth: '100%', height: '250px' }}>
          [ AD SPACE — 300×250 ]
        </div>

        {/* Share buttons */}
        <div className="w-full space-y-3 mb-4">
          <p className="font-mono text-xs text-violet-400/60 uppercase tracking-wider">Partager mon résultat</p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => shareWhatsApp(brainAge)}
              className="glass rounded-xl py-3 px-2 font-mono text-xs text-green-400 hover:bg-green-500/10 transition-all duration-300 active:scale-95 cursor-pointer flex flex-col items-center gap-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </button>
            <button
              onClick={() => shareX(brainAge)}
              className="glass rounded-xl py-3 px-2 font-mono text-xs text-sky-400 hover:bg-sky-500/10 transition-all duration-300 active:scale-95 cursor-pointer flex flex-col items-center gap-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              X / Twitter
            </button>
            <button
              onClick={() => shareScore(brainAge)}
              className="glass rounded-xl py-3 px-2 font-mono text-xs text-violet-400 hover:bg-violet-500/10 transition-all duration-300 active:scale-95 cursor-pointer flex flex-col items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Partager
            </button>
          </div>
        </div>

        {/* Replay */}
        <button
          onClick={() => {
            setScreen("welcome");
            setBrainAge(null);
            setResults([]);
          }}
          className="mt-2 px-8 py-3 glass rounded-2xl font-mono text-sm text-violet-300 hover:bg-violet-500/10 transition-all duration-300 animate-border-glow active:scale-95 cursor-pointer"
        >
          🔄 NOUVEAU SCAN
        </button>
      </div>
    );
  }

  /* ─────────────── GAME GRID (memorize + input) ─────────────── */
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Round indicator */}
      <div className="flex items-center gap-4 mb-4 md:mb-6">
        <p className="font-mono text-xs md:text-sm text-violet-400/80 tracking-widest uppercase">
          Round {round + 1} / {TOTAL_ROUNDS}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i < round
                  ? "bg-green-400"
                  : i === round
                    ? "bg-violet-400 animate-pulse"
                    : "bg-violet-800/50"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Scan status */}
      <div className="glass rounded-xl px-4 py-2 mb-4 md:mb-6">
        <p className="font-mono text-xs text-center">
          {screen === "memorize" ? (
            <span className="text-cyan-400">
              ● SCAN EN COURS — Mémorisez les chiffres...
            </span>
          ) : (
            <span className="text-amber-400">
              ● VOTRE TOUR — Cliquez dans l&apos;ordre (1, 2, 3...)
            </span>
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="relative">
        {/* Scanline effect during memorize */}
        {screen === "memorize" && (
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-scanline" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {Array.from({ length: GRID_SIZE }).map((_, i) => {
            const hasNumber = grid.has(i);
            const number = grid.get(i);
            const isCorrect = correctCells.has(i);
            const isWrong = wrongCell === i;
            const isShockwave = shockwaveCells.has(i);
            const showNumber = screen === "memorize" && hasNumber;
            const isClicked = clickedCells.has(i);

            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={screen !== "input" || isClicked || !hasNumber}
                className={`
                  w-16 h-16 md:w-[72px] md:h-[72px] rounded-xl font-sans font-black text-xl md:text-2xl
                  transition-all duration-200 cursor-pointer
                  ${isCorrect
                    ? "bg-green-500/20 border-2 border-green-400/60 text-green-300"
                    : isWrong
                      ? "bg-red-500/30 border-2 border-red-400/60 text-red-300"
                      : showNumber
                        ? "glass-strong border-2 border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : hasNumber && screen === "input" && !isClicked
                          ? "glass border border-violet-500/20 hover:border-violet-400/50 hover:bg-violet-500/10 text-transparent active:scale-90"
                          : "glass border border-violet-900/30 text-transparent"
                  }
                  ${isWrong ? "animate-shake" : ""}
                  ${isShockwave ? "animate-shockwave" : ""}
                  flex items-center justify-center select-none
                `}
              >
                {showNumber && number}
                {isCorrect && number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      {screen === "input" && (
        <div className="mt-4 md:mt-6 w-full">
          <div className="flex justify-between font-mono text-[10px] text-violet-400/50 mb-1">
            <span>Progression</span>
            <span>{nextExpected - 1} / {grid.size}</span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-900/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${((nextExpected - 1) / grid.size) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
