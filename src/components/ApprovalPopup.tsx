import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Trophy, Star, Sparkles, X } from "lucide-react";

interface ApprovalPopupProps {
  open: boolean;
  onClose: () => void;
  exerciseTitle: string;
  tutorName?: string;
}

const ApprovalPopup = ({ open, onClose, exerciseTitle, tutorName = "your tutor" }: ApprovalPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[460px] p-0 border-0 bg-transparent shadow-none overflow-visible [&>button]:hidden">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Light glassmorphic background */}
          <div className="absolute inset-0 bg-white/[0.94] backdrop-blur-[40px]" />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at 30% 0%, hsl(142 60% 50% / 0.12), transparent 55%), radial-gradient(ellipse at 80% 90%, hsl(45 90% 55% / 0.1), transparent 50%)",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.1] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Floating celebratory elements */}
          <div className="absolute top-4 left-8 text-2xl animate-bounce" style={{ animationDelay: "0s" }}>🎉</div>
          <div className="absolute top-10 right-12 text-lg animate-bounce" style={{ animationDelay: "0.3s" }}>⭐</div>
          <div className="absolute bottom-16 left-6 text-xl animate-bounce" style={{ animationDelay: "0.6s" }}>🏅</div>
          <div className="absolute bottom-10 right-8 text-lg animate-bounce" style={{ animationDelay: "0.9s" }}>🎊</div>

          <div className="relative z-10 p-10 pt-8 text-center">
            {/* Success icon */}
            <div className="relative mx-auto w-[88px] h-[88px] mb-6">
              <div className="absolute inset-0 rounded-full bg-[hsl(142,60%,50%)] opacity-10 blur-2xl scale-[2] animate-pulse" />
              <div
                className="relative w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[hsl(142,60%,45%)] to-[hsl(160,55%,50%)] flex items-center justify-center shadow-[0_8px_28px_hsl(142_60%_45%/0.3)]"
                style={{ animation: "fadeSlideUp 0.5s ease-out" }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              {/* Small trophy badge */}
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(45,90%,55%)] to-[hsl(35,85%,50%)] flex items-center justify-center shadow-[0_4px_12px_hsl(45_90%_55%/0.4)] border-[3px] border-white">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Text content */}
            <div style={{ animation: "fadeSlideUp 0.5s ease-out 0.15s both" }}>
              <h2 className="font-serif text-[26px] font-bold text-foreground mb-1.5 leading-tight">
                Exercise Approved! 🎉
              </h2>
              <p className="text-sm font-medium text-[hsl(142,50%,42%)] mb-4">
                Congratulations, you nailed it!
              </p>
            </div>

            {/* Exercise card */}
            <div
              className="bg-foreground/[0.03] border border-foreground/[0.06] rounded-2xl p-5 mb-5 text-left"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.25s both" }}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(142,60%,45%)] to-[hsl(160,55%,50%)] flex items-center justify-center shrink-0 shadow-sm">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[hsl(142,50%,42%)] uppercase tracking-[0.5px] mb-1">Approved Exercise</div>
                  <div className="text-[15px] font-bold text-foreground leading-snug">{exerciseTitle}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-1">
                    Reviewed by <span className="font-semibold text-foreground/70">{tutorName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement unlocked banner */}
            <div
              className="bg-gradient-to-r from-[hsl(45,90%,55%/0.1)] to-[hsl(35,85%,50%/0.08)] border border-[hsl(45,90%,55%/0.2)] rounded-2xl p-4 mb-6 flex items-center gap-4"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.35s both" }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(45,90%,55%)] to-[hsl(35,85%,50%)] flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[13px] font-bold text-foreground">Achievement Unlocked! 🏆</div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed mt-0.5">
                  You're one step closer to mastery. Keep this momentum going and tackle the next challenge!
                </p>
              </div>
            </div>

            {/* Motivational quote */}
            <div
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[hsl(142,60%,50%/0.08)] border border-[hsl(142,60%,50%/0.12)] mb-6"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[hsl(142,50%,42%)]" />
              <span className="text-[12px] font-medium text-[hsl(142,50%,42%)]">
                "Every expert was once a beginner — keep going!" 💪
              </span>
            </div>

            {/* Button */}
            <button
              onClick={onClose}
              className="w-full max-w-[260px] py-3.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-br from-[hsl(142,60%,45%)] to-[hsl(160,55%,50%)] shadow-[0_8px_28px_hsl(142_60%_45%/0.3)] hover:shadow-[0_12px_36px_hsl(142_60%_45%/0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              style={{ animation: "fadeSlideUp 0.5s ease-out 0.45s both" }}
            >
              Continue Learning →
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalPopup;
