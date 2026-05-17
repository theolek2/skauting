import { useState, useEffect } from 'react'

const COLORS = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#00bcd4','#009688','#4caf50','#8bc34a','#ffeb3b','#ff9800','#ff5722']
const PIECES = 80

export default function Confetti({ active, onDone }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) return
    const arr = Array.from({ length: PIECES }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50 + (Math.random() - 0.5) * 10,
      angle: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 80,
      fall: 60 + Math.random() * 40,
      rotation: Math.random() * 720 - 360,
    }))
    setPieces(arr)
    const t = setTimeout(() => { setPieces([]); onDone?.() }, 2500)
    return () => clearTimeout(t)
  }, [active])

  if (!active || pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confettiDrop 2s ${p.delay}s ease-out forwards`,
            ['--drift' ]: `${p.drift}%`,
            ['--fall'  ]: `${p.fall}%`,
            ['--rot'   ]: `${p.rotation}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiDrop {
           0% { opacity:1; transform: translate(0,0) rotate(0deg); }
          25% { opacity:1; }
         100% { opacity:0; transform: translate(var(--drift), var(--fall)) rotate(var(--rot)); }
        }
      `}</style>
    </div>
  )
}
