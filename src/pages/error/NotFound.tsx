import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, RefreshCw, Search, Ghost } from "lucide-react";

const FloatingParticle = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${x}%` }}
    initial={{ y: "100vh", opacity: 0 }}
    animate={{
      y: "-10vh",
      opacity: [0, 0.7, 0],
      x: [0, Math.random() * 60 - 30, 0],
    }}
    transition={{
      duration: 6 + Math.random() * 4,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

const GlitchText = ({ text }: { text: string }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative select-none">
      <motion.h1
        className="text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter bg-gradient-to-br from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent"
        animate={
          isGlitching
            ? { x: [0, -3, 3, -1, 1, 0], skewX: [0, -2, 2, 0] }
            : {}
        }
        transition={{ duration: 0.2 }}
      >
        {text}
      </motion.h1>
      {isGlitching && (
        <>
          <motion.h1
            className="absolute inset-0 text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter text-red-500/30"
            style={{ clipPath: "inset(20% 0 50% 0)" }}
            animate={{ x: [0, 4, -4, 0] }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.h1>
          <motion.h1
            className="absolute inset-0 text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter text-blue-500/30"
            style={{ clipPath: "inset(60% 0 10% 0)" }}
            animate={{ x: [0, -4, 4, 0] }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.h1>
        </>
      )}
    </div>
  );
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickCount, setClickCount] = useState(0);
  const [showEaster, setShowEaster] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  }, []);

  const handleGhostClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setShowEaster(true);
      setTimeout(() => {
        setShowEaster(false);
        setClickCount(0);
      }, 3000);
    }
  };

  const particles = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 0.4,
    x: Math.random() * 100,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Radial glow following mouse */}
      <motion.div
        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
        }}
        animate={{
          x: mousePos.x * 8,
          y: mousePos.y * 8,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Ghost icon */}
        <motion.div
          className="cursor-pointer"
          animate={{
            y: [0, -12, 0],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9, rotate: 360 }}
          onClick={handleGhostClick}
        >
          <Ghost className="h-16 w-16 text-primary/60" strokeWidth={1.5} />
        </motion.div>

        {/* Easter egg */}
        <AnimatePresence>
          {showEaster && (
            <motion.p
              className="absolute -top-4 text-sm font-medium text-primary/80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -10 }}
              exit={{ opacity: 0, y: -30 }}
            >
              Boo! You found me!
            </motion.p>
          )}
        </AnimatePresence>

        {/* 404 with glitch effect */}
        <motion.div
          style={{
            transform: `perspective(1000px) rotateY(${mousePos.x * 0.1}deg) rotateX(${-mousePos.y * 0.1}deg)`,
          }}
        >
          <GlitchText text="404" />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-semibold text-foreground/90">
            Lost in the void
          </h2>
          <p className="max-w-md text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Go Home
          </motion.button>

          <motion.button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="h-4 w-4 transition-transform group-hover:-rotate-45" />
            Go Back
          </motion.button>

          <motion.button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
            Explore
          </motion.button>
        </motion.div>

        {/* Animated path hint */}
        <motion.div
          className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Tip: Click the ghost 5 times
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
