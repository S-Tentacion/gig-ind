"use client";

import { motion } from "framer-motion";

const pieces = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 34) * Math.PI * 2) * (110 + (index % 5) * 28),
  y: Math.sin((index / 34) * Math.PI * 2) * (90 + (index % 4) * 26),
  color: ["#f0abfc", "#67e8f9", "#fde68a", "#c4b5fd"][index % 4],
  delay: (index % 7) * .025,
}));

export function ConfettiBurst() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-[130] grid place-items-center overflow-hidden">{pieces.map((piece) => <motion.i key={piece.id} initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: .2 }} animate={{ opacity: [0, 1, 1, 0], x: piece.x, y: piece.y, rotate: 260 + piece.id * 18, scale: [0, 1.15, .8] }} transition={{ duration: 1.45, delay: piece.delay, ease: [0.16, 1, 0.3, 1] }} className="absolute h-2.5 w-1.5 rounded-sm" style={{ backgroundColor: piece.color }}/>)}</div>;
}
