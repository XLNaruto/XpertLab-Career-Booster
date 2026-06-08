import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Rocket, Sparkles, Target, Zap, ArrowRight } from "lucide-react";
import { getEncodedCookie } from "@/utils/reusable";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Per-account key so the popup shows once per device, per account
  const traineeId = getEncodedCookie("traineeId");
  const storageKey = `welcome_seen_${traineeId || "guest"}`;

  // Show welcome popup only once per device + account (localStorage-based)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(storageKey);
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleClose();
  };

  const steps = [
    {
      icon: <Rocket className="w-10 h-10" />,
      emoji: "🚀",
      title: "Welcome Aboard, Champion!",
      subtitle: "Your journey to becoming a tech expert starts NOW",
      body: "You've just taken the most important step — showing up. Get ready to transform your skills with hands-on projects, real-world exercises, and expert mentorship.",
      gradient: "from-primary to-primary-light",
      glow: "hsl(342 80% 53% / 0.15)",
    },
    {
      icon: <Target className="w-10 h-10" />,
      emoji: "🎯",
      title: "Your Mission Awaits",
      subtitle: "90 days to mastery — are you ready?",
      body: "Complete daily exercises, crack real coding challenges, and build projects that matter. Every line of code you write brings you closer to your dream career.",
      gradient: "from-secondary to-accent",
      glow: "hsl(207 65% 50% / 0.15)",
    },
    {
      icon: <Zap className="w-10 h-10" />,
      emoji: "⚡",
      title: "Let's Make It Happen!",
      subtitle: "Consistency beats talent — every single time",
      body: "Track your attendance, complete exercises on time, and watch your progress soar. The best version of you is just 90 days away. Let's go!",
      gradient: "from-[hsl(160,60%,45%)] to-[hsl(160,50%,55%)]",
      glow: "hsl(160 60% 45% / 0.15)",
    },
  ];

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[480px] p-0 border-0 bg-transparent shadow-none overflow-hidden [&>button]:hidden">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background - light glassmorphic */}
          <div className="absolute inset-0 bg-white/[0.92] backdrop-blur-[40px]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${current.glow}, transparent 60%), radial-gradient(ellipse at 70% 80%, ${current.glow}, transparent 60%)`,
            }}
          />

          {/* Floating particles */}
          <div className="absolute top-6 right-8 text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>✨</div>
          <div className="absolute bottom-12 left-6 text-lg animate-bounce" style={{ animationDelay: "0.5s" }}>🌟</div>
          <div className="absolute top-20 left-10 text-sm animate-bounce" style={{ animationDelay: "0.8s" }}>💫</div>

          <div className="relative z-10 p-10 text-center">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === step
                      ? `w-8 bg-gradient-to-r ${current.gradient}`
                      : i < step
                      ? "w-3 bg-primary/40"
                      : "w-3 bg-foreground/10"
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${current.gradient} opacity-15 blur-xl scale-150 animate-pulse`}
              />
              <div
                className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center text-white shadow-[var(--shadow-md)]`}
                style={{ animation: "slideUp 0.5s ease-out" }}
              >
                <span className="text-4xl">{current.emoji}</span>
              </div>
            </div>

            {/* Text */}
            <div key={step} style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
              <h2 className="font-serif text-[28px] font-bold text-foreground mb-2 leading-tight">
                {current.title}
              </h2>
              <p className={`text-sm font-semibold bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent mb-4`}>
                {current.subtitle}
              </p>
              <p className="text-[14px] text-muted-foreground leading-[1.8] max-w-[360px] mx-auto font-light">
                {current.body}
              </p>
            </div>

            {/* Motivational badge */}
            <div className="mt-6 mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/[0.04] border border-foreground/[0.06]">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12px] font-medium text-muted-foreground">
                {step === 0 && "You're 1 in 100 who take action!"}
                {step === 1 && "Top performers start strong 💪"}
                {step === 2 && "Your future self will thank you 🙌"}
              </span>
            </div>

            {/* Button */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleNext}
                className={`w-full max-w-[280px] py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br ${current.gradient} border-none outline-none shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2`}
              >
                {step < 2 ? (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Start My Journey <Rocket className="w-4 h-4" /></>
                )}
              </button>
              {step < 2 && (
                <button
                  onClick={handleClose}
                  className="text-[12.5px] text-foreground/25 hover:text-foreground/50 transition-colors"
                >
                  Skip intro
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
