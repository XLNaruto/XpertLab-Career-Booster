import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { getEncodedCookie } from "@/utils/reusable";
import { idbGet, idbSet } from "@/utils/idbStore";

type Phase = "morning" | "afternoon" | "evening";

// Time-of-day scene config: sky gradient, orb color/glow, accent.
const SCENES: Record<Phase, {
  title: string;
  sky: string;        // hero sky gradient
  orb: string;        // sun/moon body gradient
  orbGlow: string;    // glow color around orb
  accent: string;     // accent text/line color
  horizon: string;    // horizon glow color
  dateColor: string;  // date label color (readable on this sky)
  birdColor: string;  // bird silhouette color
}> = {
  morning: {
    title: "Good Morning",
    sky: "linear-gradient(180deg, #fde9c8 0%, #fbbf77 45%, #f97362 100%)",
    orb: "radial-gradient(circle at 35% 35%, #fff6e0, #ffd25e 55%, #ff9d3c)",
    orbGlow: "rgba(255,196,77,0.85)",
    accent: "#ea7c3c",
    horizon: "rgba(255,180,120,0.9)",
    dateColor: "rgba(120,53,15,0.85)",
    birdColor: "rgba(80,40,20,0.6)",
  },
  afternoon: {
    title: "Good Afternoon",
    sky: "linear-gradient(180deg, #bfe9ff 0%, #6cc6f0 35%, #38b2e8 65%, #2b7fd4 100%)",
    orb: "radial-gradient(circle at 35% 35%, #ffffff, #ffe9a8 50%, #ffcf5c)",
    orbGlow: "rgba(255,236,150,0.85)",
    accent: "#1f86c9",
    horizon: "rgba(150,210,255,0.9)",
    dateColor: "rgba(12,52,90,0.85)",
    birdColor: "rgba(20,50,80,0.55)",
  },
  evening: {
    title: "Good Evening",
    sky: "linear-gradient(180deg, #0b1338 0%, #25204d 45%, #5b2a63 100%)",
    orb: "radial-gradient(circle at 38% 32%, #ffffff, #e7ecff 45%, #c8d2ff)",
    orbGlow: "rgba(200,210,255,0.7)",
    accent: "#a78bfa",
    horizon: "rgba(120,90,180,0.8)",
    dateColor: "rgba(255,255,255,0.9)",
    birdColor: "rgba(230,230,255,0.5)",
  },
};

const getPhase = (): Phase => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
};

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts, repeated daily.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Push yourself, because no one else will do it for you.", author: "Unknown" },
  { text: "Code is like humor. When you explain it, it's bad.", author: "Cory House" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
];

// Deterministic-ish star field for the evening sky.
const makeStars = () =>
  Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: (i * 37) % 100,
    top: (i * 53) % 70,
    size: 1 + (i % 3),
    delay: (i % 7) * 0.3,
  }));

// `active` gates when the popup is allowed to open, so the dashboard can show
// it only after the welcome popup has been dismissed (defaults to true so the
// component still works on its own).
const DailyGreetingPopup = ({ name, active = true }: { name?: string; active?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [phase] = useState<Phase>(getPhase);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [stars] = useState(makeStars);
  const s = SCENES[phase];

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    .toUpperCase();

  const traineeId = getEncodedCookie("traineeId");
  const today = now.toISOString().slice(0, 10);
  const storageKey = `daily_greeting_${traineeId || "guest"}_${today}`;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    idbGet<boolean>(storageKey).then((seen) => {
      if (!cancelled && !seen) timer = setTimeout(() => setOpen(true), 600);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [storageKey, active]);

  const handleClose = () => {
    idbSet(storageKey, true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[380px] p-0 border-0 bg-transparent shadow-none overflow-visible [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 28 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 230, damping: 24 }}
          className="relative rounded-[26px] overflow-hidden bg-[#0f1424] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
        >
          {/* ===== Animated sky scene ===== */}
          <div className="relative h-[200px] overflow-hidden" style={{ background: s.sky }}>
            {/* Evening stars */}
            {phase === "evening" &&
              stars.map((st) => (
                <motion.span
                  key={st.id}
                  className="absolute rounded-full bg-white"
                  style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size }}
                  animate={{ opacity: [0.15, 1, 0.15] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: st.delay, ease: "easeInOut" }}
                />
              ))}

            {/* Drifting clouds for morning/afternoon */}
            {phase !== "evening" &&
              [0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/45 blur-md"
                  style={{
                    width: 90 + i * 30,
                    height: 26 + i * 6,
                    top: 30 + i * 34,
                    left: -120,
                  }}
                  animate={{ x: [0, 520] }}
                  transition={{ duration: 16 + i * 6, repeat: Infinity, ease: "linear", delay: i * 3 }}
                />
              ))}

            {/* Flying birds (daytime only) */}
            {phase !== "evening" &&
              [
                { top: 26, delay: 0, dur: 11, scale: 1 },
                { top: 50, delay: 2.5, dur: 13, scale: 0.8 },
                { top: 16, delay: 5, dur: 14, scale: 0.65 },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  className="absolute z-[22]"
                  style={{ top: b.top, left: -40 }}
                  animate={{ x: [0, 460], y: [0, -8, 4, 0] }}
                  transition={{ duration: b.dur, repeat: Infinity, ease: "linear", delay: b.delay }}
                >
                  <motion.svg
                    width={22 * b.scale}
                    height={10 * b.scale}
                    viewBox="0 0 22 10"
                    animate={{ scaleY: [1, 0.5, 1] }}
                    transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path
                      d="M1 8 Q5.5 1 11 6 Q16.5 1 21 8"
                      fill="none"
                      stroke={s.birdColor}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </motion.div>
              ))}

            {/* The rising orb (sun / moon) with pulsing glow */}
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.25 }}
              className="absolute left-1/2 -translate-x-1/2 top-9 z-20"
            >
              <motion.div
                className="relative rounded-full"
                style={{ width: 78, height: 78, background: s.orb }}
                animate={{ boxShadow: [
                  `0 0 30px 4px ${s.orbGlow}`,
                  `0 0 56px 14px ${s.orbGlow}`,
                  `0 0 30px 4px ${s.orbGlow}`,
                ] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Moon craters for evening */}
                {phase === "evening" && (
                  <>
                    <span className="absolute rounded-full bg-black/10" style={{ width: 14, height: 14, top: 18, left: 22 }} />
                    <span className="absolute rounded-full bg-black/10" style={{ width: 9, height: 9, top: 40, left: 46 }} />
                    <span className="absolute rounded-full bg-black/10" style={{ width: 7, height: 7, top: 50, left: 20 }} />
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Horizon glow + curved hill silhouette */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24"
              style={{ background: `radial-gradient(120% 80% at 50% 120%, ${s.horizon}, transparent 60%)` }}
            />
            <svg className="absolute -bottom-px left-0 w-full" viewBox="0 0 380 60" preserveAspectRatio="none" style={{ height: 56 }}>
              <path d="M0 60 L0 34 Q95 6 190 30 T380 26 L380 60 Z" fill="#0f1424" />
            </svg>

            {/* Date label */}
            <div className="absolute top-4 left-5 z-10">
              <span className="text-[10.5px] font-bold tracking-[0.18em]" style={{ color: s.dateColor }}>{dateLabel}</span>
            </div>
          </div>

          {/* ===== Body (dark glass) ===== */}
          <div className="relative px-7 pt-5 pb-7">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-[26px] font-bold text-white leading-tight tracking-tight"
            >
              {s.title}
              {name && <span style={{ color: s.accent }}>,&nbsp;{name}</span>}
            </motion.h2>

            {/* Quote with accent bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex gap-3"
            >
              <span className="w-[3px] rounded-full shrink-0" style={{ background: s.accent }} />
              <div>
                <p className="text-[13.5px] text-white/75 italic leading-relaxed">{quote.text}</p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="group mt-6 w-full py-3.5 rounded-2xl text-[14.5px] font-bold text-[#0f1424] bg-white flex items-center justify-center gap-2 shadow-lg outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGreetingPopup;
