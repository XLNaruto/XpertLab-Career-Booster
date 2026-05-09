import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const InteractiveBackground = ({ children }: { children: React.ReactNode }) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  // Parallax for orbs
  const p1X = useTransform(smoothX, [0, 800], [-20, 20]);
  const p1Y = useTransform(smoothY, [0, 800], [-20, 20]);
  const p2X = useTransform(smoothX, [0, 800], [15, -15]);
  const p2Y = useTransform(smoothY, [0, 800], [15, -15]);
  const p3X = useTransform(smoothX, [0, 800], [-10, 10]);
  const p3Y = useTransform(smoothY, [0, 800], [10, -10]);

  // Parallax for geometric shapes
  const s0X = useTransform(smoothX, [0, 800], [-14.4, 14.4]);
  const s0Y = useTransform(smoothY, [0, 800], [-14.4, 14.4]);
  const s1X = useTransform(smoothX, [0, 800], [-9.6, 9.6]);
  const s1Y = useTransform(smoothY, [0, 800], [-9.6, 9.6]);
  const s2X = useTransform(smoothX, [0, 800], [-12, 12]);
  const s2Y = useTransform(smoothY, [0, 800], [-12, 12]);
  const s3X = useTransform(smoothX, [0, 800], [-16.8, 16.8]);
  const s3Y = useTransform(smoothY, [0, 800], [-16.8, 16.8]);
  const s4X = useTransform(smoothX, [0, 800], [-7.2, 7.2]);
  const s4Y = useTransform(smoothY, [0, 800], [-7.2, 7.2]);
  const s5X = useTransform(smoothX, [0, 800], [-13.2, 13.2]);
  const s5Y = useTransform(smoothY, [0, 800], [-13.2, 13.2]);
  const sPX = [s0X, s1X, s2X, s3X, s4X, s5X];
  const sPY = [s0Y, s1Y, s2Y, s3Y, s4Y, s5Y];

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const id = Date.now();
      setRipples((prev) => [
        ...prev,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 1000);
    },
    []
  );

  return (
    <div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      className="relative overflow-hidden"
    >
      {/* Mouse-following spotlight */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, hsl(342 80% 53% / 0.08) 0%, hsl(207 65% 55% / 0.04) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute w-[100px] h-[100px] rounded-full border-2 border-primary/20 pointer-events-none z-0"
          style={{ left: ripple.x - 50, top: ripple.y - 50 }}
        />
      ))}

      {/* Parallax gradient orbs */}
      <motion.div style={{ x: p1X, y: p1Y }} className="absolute top-[8%] right-[10%] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,hsl(342_80%_53%/0.12),transparent_70%)] blur-[2px] pointer-events-none" />
      <motion.div style={{ x: p2X, y: p2Y }} className="absolute bottom-[12%] left-[5%] w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle,hsl(207_65%_55%/0.1),transparent_70%)] blur-[2px] pointer-events-none" />
      <motion.div style={{ x: p3X, y: p3Y }} className="absolute top-[45%] left-[15%] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,hsl(160_50%_50%/0.08),transparent_70%)] blur-[2px] pointer-events-none" />

      {/* All decorative objects layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Geometric shapes with parallax */}
        {[
          { top: "12%", left: "8%", size: 40, delay: 0, duration: 8, color: "hsl(342 80% 53% / 0.1)", border: "hsl(342 80% 53% / 0.15)" },
          { top: "25%", right: "15%", size: 28, delay: 1, duration: 10, color: "hsl(207 65% 55% / 0.08)", border: "hsl(207 65% 55% / 0.12)" },
          { top: "65%", left: "20%", size: 34, delay: 2, duration: 9, color: "hsl(160 50% 50% / 0.08)", border: "hsl(160 50% 50% / 0.12)" },
          { top: "78%", right: "12%", size: 24, delay: 0.5, duration: 11, color: "hsl(342 80% 53% / 0.07)", border: "hsl(342 80% 53% / 0.1)" },
          { top: "40%", left: "5%", size: 20, delay: 1.5, duration: 13, color: "hsl(45 80% 55% / 0.08)", border: "hsl(45 80% 55% / 0.12)" },
          { top: "8%", left: "45%", size: 18, delay: 3, duration: 14, color: "hsl(270 50% 55% / 0.07)", border: "hsl(270 50% 55% / 0.1)" },
        ].map((shape, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? 360 : -360, y: [0, -15, 10, -8, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: shape.delay },
              scale: { duration: 0.8, delay: shape.delay },
              rotate: { duration: shape.duration, repeat: Infinity, ease: "linear" },
              y: { duration: shape.duration * 0.7, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{
              position: "absolute", top: shape.top,
              left: "left" in shape ? shape.left : undefined,
              right: "right" in shape ? shape.right : undefined,
              width: shape.size, height: shape.size,
              borderRadius: i % 3 === 0 ? "30%" : i % 3 === 1 ? "50%" : "8px",
              background: shape.color, border: `1.5px solid ${shape.border}`,
              backdropFilter: "blur(4px)", x: sPX[i], translateY: sPY[i],
            }}
          />
        ))}

        {/* Floating particles */}
        {[
          { top: "18%", left: "30%", delay: 0, duration: 6 },
          { top: "35%", right: "8%", delay: 1.2, duration: 7 },
          { top: "55%", left: "10%", delay: 0.8, duration: 5 },
          { top: "72%", left: "40%", delay: 2, duration: 8 },
          { top: "88%", right: "30%", delay: 1.5, duration: 6 },
          { top: "5%", right: "35%", delay: 0.3, duration: 7 },
          { top: "48%", right: "25%", delay: 2.5, duration: 5.5 },
          { top: "30%", left: "42%", delay: 1.8, duration: 6.5 },
        ].map((dot, i) => (
          <motion.div
            key={`dot-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.7, 0], y: [0, -20, -10, -30, -40], x: [0, 5, -5, 8, 0] }}
            transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: dot.top, left: "left" in dot ? dot.left : undefined, right: "right" in dot ? dot.right : undefined }}
            className="w-1.5 h-1.5 rounded-full bg-primary/30"
          />
        ))}

        {/* Hollow rings */}
        {[
          { top: "6%", left: "25%", size: 60, border: "hsl(342 80% 53% / 0.1)", duration: 16, delay: 0.5 },
          { top: "82%", left: "35%", size: 44, border: "hsl(207 65% 55% / 0.08)", duration: 20, delay: 1.5 },
          { top: "38%", right: "5%", size: 52, border: "hsl(160 50% 50% / 0.07)", duration: 18, delay: 2.5 },
          { top: "58%", right: "35%", size: 36, border: "hsl(270 50% 55% / 0.08)", duration: 14, delay: 0 },
        ].map((ring, i) => (
          <motion.div
            key={`ring-${i}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.8, 0.4, 0.8, 0], scale: [0.8, 1, 1.1, 1, 0.8], rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: ring.duration, delay: ring.delay, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: ring.top,
              left: "left" in ring ? ring.left : undefined,
              right: "right" in ring ? ring.right : undefined,
              width: ring.size, height: ring.size, borderRadius: "50%",
              border: `2px solid ${ring.border}`,
            }}
          />
        ))}

        {/* Pulsing circles */}
        {[
          { top: "15%", right: "28%", size: 14, color: "hsl(342 80% 53% / 0.15)", duration: 3 },
          { top: "70%", left: "8%", size: 10, color: "hsl(207 65% 55% / 0.12)", duration: 4 },
          { top: "90%", right: "15%", size: 12, color: "hsl(45 80% 55% / 0.12)", duration: 3.5 },
          { top: "28%", left: "3%", size: 16, color: "hsl(160 50% 50% / 0.1)", duration: 4.5 },
          { top: "50%", left: "45%", size: 8, color: "hsl(342 80% 53% / 0.1)", duration: 2.8 },
        ].map((pulse, i) => (
          <motion.div
            key={`pulse-${i}`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: pulse.duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            style={{
              position: "absolute", top: pulse.top,
              left: "left" in pulse ? pulse.left : undefined,
              right: "right" in pulse ? pulse.right : undefined,
              width: pulse.size, height: pulse.size, borderRadius: "50%",
              background: pulse.color,
            }}
          />
        ))}

        {/* Diamonds */}
        {[
          { top: "20%", left: "15%", size: 22, color: "hsl(342 80% 53% / 0.08)", border: "hsl(342 80% 53% / 0.12)", duration: 7 },
          { top: "75%", right: "22%", size: 18, color: "hsl(207 65% 55% / 0.06)", border: "hsl(207 65% 55% / 0.1)", duration: 9 },
          { top: "45%", left: "38%", size: 14, color: "hsl(45 80% 55% / 0.07)", border: "hsl(45 80% 55% / 0.1)", duration: 11 },
        ].map((d, i) => (
          <motion.div
            key={`diamond-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.3, 0.7, 0], rotate: [45, 45, 45, 45, 45], y: [0, -18, 8, -10, 0], scale: [1, 1.15, 0.9, 1.1, 1] }}
            transition={{ duration: d.duration, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
            style={{
              position: "absolute", top: d.top,
              left: "left" in d ? d.left : undefined,
              right: "right" in d ? d.right : undefined,
              width: d.size, height: d.size, borderRadius: "3px",
              background: d.color, border: `1.5px solid ${d.border}`, transform: "rotate(45deg)",
            }}
          />
        ))}

        {/* Orbiting dots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={`orbit-${i}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 12 + i * 2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: 100 + i * 40, height: 100 + i * 40,
              marginTop: -(50 + i * 20), marginLeft: -(50 + i * 20),
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                top: 0, left: "50%", width: 4 + (i % 3), height: 4 + (i % 3),
                marginLeft: -(2 + (i % 3) / 2),
                background: i % 2 === 0 ? "hsl(342 80% 53% / 0.2)" : "hsl(207 65% 55% / 0.18)",
                boxShadow: i % 2 === 0 ? "0 0 8px hsl(342 80% 53% / 0.15)" : "0 0 8px hsl(207 65% 55% / 0.12)",
              }}
            />
          </motion.div>
        ))}

        {/* Plus / cross signs */}
        {[
          { top: "10%", right: "40%", size: 16, color: "hsl(342 80% 53% / 0.12)", duration: 10 },
          { top: "85%", left: "18%", size: 12, color: "hsl(207 65% 55% / 0.1)", duration: 8 },
          { top: "35%", left: "48%", size: 14, color: "hsl(160 50% 50% / 0.09)", duration: 12 },
        ].map((c, i) => (
          <motion.div
            key={`cross-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.2, 0.5, 0], rotate: [0, 90, 180, 270, 360], y: [0, -12, 6, -8, 0] }}
            transition={{ duration: c.duration, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
            style={{
              position: "absolute", top: c.top,
              left: "left" in c ? c.left : undefined,
              right: "right" in c ? c.right : undefined,
              width: c.size, height: c.size,
            }}
          >
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, marginTop: -1, borderRadius: 1, background: c.color }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, borderRadius: 1, background: c.color }} />
          </motion.div>
        ))}

        {/* Hexagons */}
        {[
          { top: "22%", right: "8%", size: 36, stroke: "hsl(342 80% 53% / 0.1)", duration: 15 },
          { top: "60%", left: "3%", size: 28, stroke: "hsl(207 65% 55% / 0.08)", duration: 18 },
          { top: "92%", left: "42%", size: 24, stroke: "hsl(45 80% 55% / 0.09)", duration: 13 },
        ].map((hex, i) => (
          <motion.div
            key={`hex-${i}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.7, 0.3, 0.6, 0], rotate: i % 2 === 0 ? [0, 60] : [0, -60], y: [0, -10, 5, -8, 0] }}
            transition={{ duration: hex.duration, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
            style={{
              position: "absolute", top: hex.top,
              left: "left" in hex ? hex.left : undefined,
              right: "right" in hex ? hex.right : undefined,
              width: hex.size, height: hex.size,
            }}
          >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <polygon points="50,2 93,25 93,75 50,98 7,75 7,25" stroke={hex.stroke} strokeWidth="3" fill="none" />
            </svg>
          </motion.div>
        ))}

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, hsl(342 80% 53%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }}
        />

        {/* SVG lines + curves + circles */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <motion.line x1="10%" y1="20%" x2="40%" y2="50%" stroke="hsl(342 80% 53% / 0.06)" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.line x1="60%" y1="15%" x2="30%" y2="70%" stroke="hsl(207 65% 55% / 0.05)" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 10, delay: 2, repeat: Infinity, ease: "easeInOut" }} />
          <motion.line x1="80%" y1="60%" x2="50%" y2="30%" stroke="hsl(342 80% 53% / 0.04)" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 9, delay: 4, repeat: Infinity, ease: "easeInOut" }} />
          <motion.path d="M 10% 80% Q 30% 20%, 60% 50%" stroke="hsl(342 80% 53% / 0.05)" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 12, delay: 1, repeat: Infinity, ease: "easeInOut" }} />
          <motion.path d="M 80% 10% Q 50% 50%, 20% 90%" stroke="hsl(207 65% 55% / 0.04)" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 14, delay: 3, repeat: Infinity, ease: "easeInOut" }} />
          <motion.path d="M 5% 50% C 25% 10%, 75% 90%, 95% 50%" stroke="hsl(160 50% 50% / 0.04)" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 16, delay: 5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx="20%" cy="30%" r="40" stroke="hsl(342 80% 53% / 0.05)" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 10, delay: 1.5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.circle cx="75%" cy="75%" r="30" stroke="hsl(207 65% 55% / 0.04)" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 8, delay: 3.5, repeat: Infinity, ease: "easeInOut" }} />
        </svg>
      </div>

      {/* Content on top */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default InteractiveBackground;
