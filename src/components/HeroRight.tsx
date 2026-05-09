const techs = [
  { icon: "🌐", name: "HTML / CSS", iconBg: "rgba(240,102,40,0.12)" },
  { icon: "⚡", name: "JavaScript", iconBg: "rgba(234,179,8,0.12)" },
  { icon: "⚛️", name: "React.js", iconBg: "rgba(6,182,212,0.12)" },
  { icon: "🟢", name: "Node.js", iconBg: "rgba(34,197,94,0.12)" },
  { icon: "📱", name: "Mobile Application", iconBg: "rgba(249,115,22,0.12)" },
];

const HeroRight = () => (
  <div className="animate-slide-left flex-shrink-0 relative">
    {/* Float badge 1 */}
    <div className="absolute -top-5 -left-[80px] animate-float1 bg-white/[0.88] border border-white/[0.98] rounded-xl px-4 py-3 backdrop-blur-[20px] shadow-[0_16px_40px_hsl(228_42%_12%/0.12),inset_0_1px_0_white] z-10">
      <div className="text-[10px] text-foreground/50 uppercase tracking-[0.8px] mb-1">Practical Learning</div>
      <div className="text-lg font-bold font-serif bg-gradient-to-br from-primary to-primary-mid bg-clip-text text-transparent">3</div>
      <div className="text-[11px] text-foreground/50">In Month</div>
    </div>

    {/* Main Card */}
    <div className="w-[360px] bg-white/[0.68] border border-white/[0.92] rounded-3xl p-8 backdrop-blur-[28px] shadow-[var(--shadow-lg),inset_0_1px_0_white,inset_0_-1px_0_hsl(228_42%_12%/0.04)] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-[60px] -right-[60px] w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,hsl(342_80%_53%/0.12),transparent_70%)]" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[1px] uppercase text-primary mb-5 w-full justify-center">
          <span className="w-4 h-px bg-primary-mid" />Course Technologies<span className="w-4 h-px bg-primary-mid" />
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {techs.map((t) => (
            <div key={t.name} className="flex items-center gap-3.5 px-4 py-[13px] bg-white/[0.55] border border-white/[0.9] rounded-[10px] shadow-[0_2px_8px_hsl(228_42%_12%/0.05)] hover:bg-white/[0.85] hover:border-white hover:shadow-[0_4px_16px_hsl(228_42%_12%/0.09)] hover:translate-x-1 transition-all duration-200 cursor-default">
              <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: t.iconBg }}>
                {t.icon}
              </div>
              <div className="text-[13.5px] font-medium text-foreground">{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Float badge 2 */}
    <div className="absolute bottom-[-20px] -right-[50px] animate-float2 bg-white/[0.88] border border-white/[0.98] rounded-xl px-4 py-3 backdrop-blur-[20px] shadow-[0_16px_40px_hsl(228_42%_12%/0.12),inset_0_1px_0_white] z-10">
      <div className="text-[10px] text-foreground/50 uppercase tracking-[0.8px] mb-1">Attendance</div>
      <div className="text-lg font-bold font-serif bg-gradient-to-br from-primary to-primary-mid bg-clip-text text-transparent">70%</div>
      <div className="text-[11px] text-foreground/50">Required !</div>
    </div>
  </div>
);

export default HeroRight;
