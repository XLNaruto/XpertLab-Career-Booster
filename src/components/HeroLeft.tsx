import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const useCountUp = (target: number, duration = 1800, delay = 600) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const timeout = setTimeout(() => {
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }, delay);

        return () => clearTimeout(timeout);
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, delay]);

  return { count, ref };
};

const CountUpStat = ({ num, suffix, label }: { num: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(num);
  return (
    <div ref={ref}>
      <div className="font-serif text-[32px] font-bold bg-gradient-to-br from-primary to-primary-mid bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-[12.5px] text-foreground/50 mt-0.5">{label}</div>
    </div>
  );
};

const HeroLeft = () => (
  <div className="max-w-[560px]">
    {/* Eyebrow */}
    <div className="animate-slide-up inline-flex items-center gap-2.5 px-4 py-[7px] border border-primary/[0.28] rounded-full bg-primary/[0.07] mb-7" style={{ animationDelay: "0.1s" }}>
      <div className="w-1.5 h-1.5 rounded-full bg-primary-mid shadow-[0_0_8px_hsl(var(--primary-mid))] animate-pulse-dot" />
      <span className="text-xs font-semibold text-primary tracking-[1.2px] uppercase">Professional IT Training Program</span>
    </div>

    {/* Headline */}
    <h1 className="animate-slide-up font-serif text-[clamp(48px,5.5vw,72px)] font-bold leading-[1.1] mb-6 -tracking-[0.5px]" style={{ animationDelay: "0.2s" }}>
      <div className="text-foreground">Elevate Your</div>
      <div className="bg-gradient-to-br from-primary via-primary-mid to-secondary bg-clip-text text-transparent">Tech Career</div>
    </h1>

    {/* Body */}
    <p className="animate-slide-up text-base leading-[1.8] text-foreground/50 mb-11 max-w-[440px] font-light" style={{ animationDelay: "0.3s" }}>
      Master in-demand technologies through structured exercises and expert mentorship—your journey from learner to professional starts here.
    </p>

    {/* CTAs */}
    <div className="animate-slide-up flex gap-3.5 flex-wrap mb-[52px]" style={{ animationDelay: "0.4s" }}>
      <Link to="/login" className="px-[38px] py-[15px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[10px] text-[15px] font-semibold shadow-[var(--shadow-primary)] hover:shadow-[0_14px_40px_hsl(342_80%_53%/0.42)] hover:-translate-y-0.5 transition-all duration-300">
        Start Learning Now →
      </Link>
    </div>

    {/* Stats */}
    <div className="animate-slide-up flex gap-9" style={{ animationDelay: "0.5s" }}>
      <CountUpStat num={30} suffix="+" label="Professional Trainers" />
      <CountUpStat num={12} suffix="+" label="Tech Courses" />
    </div>
  </div>
);

export default HeroLeft;
