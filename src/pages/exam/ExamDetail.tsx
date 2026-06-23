import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Loader2,
  FileText,
  Clock,
  TimerOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { decryptUrlData, encryptUrlData, getEncodedCookie, toasterrormsg, toastsuccessmsg } from "@/utils/reusable";

// Format a millisecond duration as M:SS (or H:MM:SS for long exams).
const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const MAX_STRIKES = 3;
const COOLDOWN_SECONDS = 10;

// Normalised question used by the UI. The selected value (and the value sent to
// submitAnswer) is the option's full text, e.g. "<a>".
type Question = {
  id: string;
  title: string;
  options: string[]; // option texts
  selected: string; // selected option text, "" when unanswered
};

// Raw question shape from the exam detail API.
type ApiQuestion = {
  trainingexamquestionId: string;
  title: string;
  options?: Array<{ text: string } | string>;
  submittedAnswer?: string;
  attempted?: boolean;
};

const normalizeQuestion = (q: ApiQuestion): Question => ({
  id: String(q.trainingexamquestionId),
  title: q.title,
  options: (q.options || []).map((o) => (typeof o === "string" ? o : o.text)),
  selected: q.submittedAnswer || "",
});

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { examallocationId = "", name = "" } = decryptUrlData(searchParams.get("data"));

  const [examName, setExamName] = useState(name);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  // Anti-cheat: focus-loss strikes. Refs mirror state so the event handlers
  // (registered once) always read the latest value.
  const [strikes, setStrikes] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showStrikeInfo, setShowStrikeInfo] = useState(false);
  // The strike-info popover is portalled to <body> (the header card's
  // backdrop-blur clips absolutely-positioned children), so it's anchored to
  // the button's viewport rect.
  const strikeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [strikePos, setStrikePos] = useState<{ top: number; right: number } | null>(null);
  const toggleStrikeInfo = () =>
    setShowStrikeInfo((v) => {
      const next = !v;
      if (next && strikeBtnRef.current) {
        const r = strikeBtnRef.current.getBoundingClientRect();
        setStrikePos({ top: r.bottom + 8, right: window.innerWidth - r.right });
      }
      return next;
    });

  const strikesRef = useRef(0);
  const activeRef = useRef(false); // exam in progress (loaded, not finished/terminated)
  const terminatedRef = useRef(false);
  const awayRef = useRef(false); // currently outside the exam window
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer. The deadline is derived from the server's startedAt +
  // duration, so it survives a refresh and can't be reset by clearing storage.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const timedOutRef = useRef(false);

  // Guided intro tour element refs.
  const timerRef = useRef<HTMLSpanElement | null>(null);
  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);
  const introShownRef = useRef(false);
  const tourRef = useRef<ReturnType<typeof introJs.tour> | null>(null);

  // Deferred start: when the exam hasn't been marked STARTED yet (the list
  // skips that call so the timer doesn't run during the intro), the exam is
  // begun — STARTED + countdown — only once the intro finishes.
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false); // guards beginExam against double-fire
  const pendingStartRef = useRef(false); // true = needs the STARTED status call
  const durationRef = useRef(0);

  // ── Load detail ────────────────────────────────────────────────────────
  const examDetailApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exam/detail",
      { examallocationId },
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d = response.data.data || {};
      const rawQuestions: ApiQuestion[] = Array.isArray(d)
        ? d
        : d.questions || [];
      setQuestions(rawQuestions.map(normalizeQuestion));
      setExamName(d.exam?.name || d.examName || name);
      // Resume the trainee's existing strike count, if the server tracks it.
      const existingStrikes = Number(
        d.exam?.terminationStrike ?? d.terminationStrike ?? 0,
      );
      if (existingStrikes > 0) {
        strikesRef.current = existingStrikes;
        setStrikes(existingStrikes);
      }
      // Already terminated on the server (status or strike count) → show it.
      const allocStatus = d.examallocation?.status || d.status;
      if (allocStatus === "TERMINATED" || existingStrikes >= MAX_STRIKES) {
        terminatedRef.current = true;
        setTerminated(true);
        setLoading(false);
        return;
      }
      // Derive the countdown deadline from the server: startedAt + duration.
      // Recomputed on every load, so a refresh resumes at the right time.
      const startedAt = d.examallocation?.startedAt || d.startedAt;
      const durationMin = Number(d.exam?.duration ?? d.duration ?? 0);
      durationRef.current = durationMin;
      // The countdown and anti-cheat stay paused until the intro finishes (see
      // beginExam). Until then we only show a frozen preview of the timer so
      // the intro can point to it — it never ticks before the intro ends.
      if (startedAt && durationMin > 0) {
        // Exam already in progress (resume) → deadline is the server's time.
        const start = new Date(startedAt).getTime();
        if (!Number.isNaN(start)) {
          deadlineRef.current = start + durationMin * 60 * 1000;
          setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
        }
      } else {
        // Not started yet → STARTED is flagged only once the intro finishes.
        // Preview the full duration so the intro can point to the timer.
        pendingStartRef.current = true;
        if (durationMin > 0) setRemainingMs(durationMin * 60 * 1000);
      }
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (examallocationId) examDetailApiCall();
    return () => {
      // Navigating away from the exam (e.g. to Dashboard) while it is still in
      // progress counts as leaving the exam → report a strike to the server,
      // exactly like a focus-loss timeout. After 3 the server terminates it.
      if (activeRef.current && !terminatedRef.current && !timedOutRef.current) {
        strikesRef.current += 1;
        terminateApiCall();
      }
      clearTick();
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examallocationId]);

  // ── Terminate (anti-cheat) API ─────────────────────────────────────────
  const terminateApiCall = async () => {
    await postData(
      "private/trainee/exam/terminate",
      { examallocationId },
      apiHeader(false, 2),
    );
  };

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  // Fires when a 10s countdown elapses without the trainee returning. Counts as
  // one strike; if they are STILL away, the next strike's countdown starts
  // instantly so strikes keep accruing every 10s. The 3rd strike terminates.
  const handleStrikeTimeout = () => {
    const count = strikesRef.current + 1;
    strikesRef.current = count;
    setStrikes(count);
    terminateApiCall();
    if (count >= MAX_STRIKES) {
      terminatedRef.current = true;
      activeRef.current = false;
      awayRef.current = false;
      setShowWarning(false);
      setTerminated(true);
      return;
    }
    if (awayRef.current) {
      runCountdown(); // still away → immediately start the next strike's countdown
    } else {
      setShowWarning(false);
    }
  };

  // Start (or restart) a 10s countdown while the exam window is unfocused.
  const runCountdown = () => {
    clearTick();
    const startedAt = Date.now();
    setShowWarning(true);
    setCooldown(COOLDOWN_SECONDS);
    tickRef.current = setInterval(() => {
      const remaining = COOLDOWN_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        return;
      }
      clearTick();
      handleStrikeTimeout();
    }, 250);
  };

  // Register focus-loss / focus-return listeners once.
  useEffect(() => {
    const handleAway = () => {
      if (!activeRef.current || terminatedRef.current) return;
      if (awayRef.current) return; // already counting down
      awayRef.current = true;
      runCountdown();
    };
    const handleBack = () => {
      if (!awayRef.current) return;
      awayRef.current = false;
      // Returned before the countdown elapsed → close immediately, no strike.
      clearTick();
      setShowWarning(false);
    };
    const handleVisibility = () => {
      if (document.hidden) handleAway();
      else handleBack();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleAway);
    window.addEventListener("focus", handleBack);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleAway);
      window.removeEventListener("focus", handleBack);
      clearTick();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time's up: flag the exam TIMEOUT on the server and show the timeout screen.
  const handleTimeout = () => {
    if (timedOutRef.current || !activeRef.current) return;
    timedOutRef.current = true;
    activeRef.current = false;
    clearTick();
    postData(
      "private/trainee/exam/updateStatus",
      { examallocationId, status: "TIMEOUT" },
      apiHeader(false, 2),
    );
    setTimedOut(true);
  };

  // Begin the exam — the moment the intro ends (or immediately if the intro has
  // already been seen today). Switches on the countdown and the anti-cheat, and
  // for a not-yet-started exam flags STARTED on the server. No-op if already
  // begun. This is what actually "starts" the timer and termination tracking.
  const beginExam = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    activeRef.current = true;
    if (pendingStartRef.current) {
      // Fresh exam → set the deadline from now and record STARTED server-side.
      pendingStartRef.current = false;
      if (durationRef.current > 0) {
        deadlineRef.current = Date.now() + durationRef.current * 60 * 1000;
        setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
      }
      postData(
        "private/trainee/exam/updateStatus",
        { examallocationId, status: "STARTED" },
        apiHeader(false, 2),
      );
    } else if (deadlineRef.current != null) {
      // Resume → deadline is already the server's; refresh the displayed value.
      setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
    }
    setStarted(true);
  };

  // Tick the countdown once per second off the server-derived deadline.
  useEffect(() => {
    if (loading || !started || deadlineRef.current == null) return;
    const tick = () => {
      const rem = (deadlineRef.current as number) - Date.now();
      setRemainingMs(Math.max(0, rem));
      if (rem <= 0) handleTimeout();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, started]);

  // ── Guided intro tour (intro.js) ───────────────────────────────────────
  // Runs once per exam allocation, after questions render. Walks the trainee
  // through the welcome, timer, question/answer area, the Save button and the
  // anti-cheat termination rules before they begin answering.
  useEffect(() => {
    if (loading || questions.length === 0 || finished || terminated || timedOut) return;
    if (introShownRef.current) return;
    // Once per account, per day: scope the key to the trainee + today's date.
    const traineeId = getEncodedCookie("traineeId") || "guest";
    const today = new Date().toISOString().slice(0, 10);
    const seenKey = `exam-intro-seen:${traineeId}:${today}`;
    // Already seen today → skip the tour and begin the exam straight away.
    if (localStorage.getItem(seenKey)) {
      introShownRef.current = true;
      beginExam();
      return;
    }

    // Distinguishes a normal close (✕ / Start Exam → begin the exam) from a
    // teardown exit on unmount (just remove the overlay, don't start anything).
    let tearingDown = false;

    // Wait one paint so the timer/question/button refs are mounted & laid out.
    const t = setTimeout(() => {
      introShownRef.current = true;
      const tour = introJs.tour();
      tourRef.current = tour;
      tour.setOptions({
        showProgress: true,
        showBullets: false,
        exitOnOverlayClick: false,
        exitOnEsc: false,
        scrollToElement: true,
        overlayOpacity: 0.6,
        nextLabel: "Next →",
        prevLabel: "← Back",
        doneLabel: "Start Exam",
        tooltipClass: "exam-intro-tooltip",
        steps: [
          {
            title: "👋 Welcome to your exam",
            intro:
              `Hi! You're about to start <b>${examName || "your exam"}</b>. ` +
              "Take a quick 30-second tour so you know exactly how everything works. " +
              "Once you finish this tour, just start answering — good luck!",
          },
          {
            element: timerRef.current,
            title: "⏱️ Your countdown timer",
            intro:
              "Keep an eye on this timer — it shows the time you have left. " +
              "It turns red in the final minute, and the exam closes automatically when it reaches zero. " +
              "Any answers you've saved are kept.",
            position: "bottom",
          },
          {
            element: questionCardRef.current,
            title: "📝 Questions & answers",
            intro:
              "Read each question here and pick the option you think is correct. " +
              "Your selection is highlighted. Use the numbered chips above to revisit questions you've already answered.",
            position: "top",
          },
          {
            element: saveBtnRef.current,
            title: "💾 Save & move on",
            intro:
              "When you're happy with your answer, click <b>Save &amp; Next</b> to record it and move to the next question. " +
              "On the last question this becomes <b>Save &amp; Finish</b> to submit your exam.",
            position: "top",
          },
          {
            title: "🚫 Stay in the exam window",
            intro:
              "Important: don't switch tabs, minimise, or leave this page during the exam. " +
              `Each time you do, a ${COOLDOWN_SECONDS}-second countdown starts — if you don't return in time you get a strike. ` +
              `After <b>${MAX_STRIKES} strikes</b> the exam is terminated automatically. ` +
              "Stay focused and you'll be fine!",
          },
        ],
      });
      const markSeen = () => localStorage.setItem(seenKey, "1");
      // "Start Exam" (done) → begin the exam: mark STARTED, start the timer,
      // dismiss the tour, scroll to the top and greet the trainee.
      tour.onComplete(() => {
        markSeen();
        beginExam();
        window.scrollTo({ top: 0, behavior: "smooth" });
        toastsuccessmsg("Exam started — good luck! 🎯");
      });
      // Closing via the ✕ also starts the exam (the timer was waiting on the
      // intro), but silently without the greeting. A teardown exit (unmount)
      // only removes the overlay — it must not start the exam.
      tour.onExit(() => {
        tourRef.current = null;
        if (tearingDown) return;
        markSeen();
        beginExam();
      });
      tour.start();
    }, 350);

    return () => {
      clearTimeout(t);
      // Exiting the exam while the tour is open must tear down its body-level
      // overlay, otherwise it lingers (and stacks on the next visit).
      if (tourRef.current) {
        tearingDown = true;
        try {
          tourRef.current.exit(true);
        } catch {
          /* already gone */
        }
        tourRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length, finished, terminated, timedOut]);

  // After termination/timeout, bounce back to the exam list.
  useEffect(() => {
    if (!terminated && !timedOut) return;
    const t = setTimeout(() => navigate("/exam"), 4500);
    return () => clearTimeout(t);
  }, [terminated, timedOut, navigate]);

  // ── Answer handling ────────────────────────────────────────────────────
  const setSelected = (key: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === current ? { ...q, selected: key } : q)),
    );
  };

  const submitAnswer = async (q: Question) => {
    if (!q.selected) return true; // nothing to save, allow navigation
    setSaving(true);
    const response: any = await postData(
      "private/trainee/exam/submitAnswer",
      {
        examallocationId,
        trainingexamquestionId: q.id,
        answer: q.selected,
      },
      apiHeader(false, 2),
    );
    setSaving(false);
    const ok =
      String(response?.status) === "200" &&
      String(response.data?.status) === "200";
    if (!ok) toasterrormsg(response?.data?.message || "Could not save your answer");
    return ok;
  };

  const handleSaveNext = async () => {
    const q = questions[current];
    if (!q.selected) {
      toasterrormsg("Please select an answer before continuing");
      return;
    }
    const ok = await submitAnswer(q);
    if (!ok) return;
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // Last question saved — exam complete. Show the finished card; the
      // trainee taps "See Result" to go to the dedicated result page.
      activeRef.current = false;
      setFinished(true);
    }
  };

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const answeredCount = useMemo(
    () => questions.filter((q) => q.selected).length,
    [questions],
  );
  const total = questions.length;
  const progressPercent = total ? Math.round((answeredCount / total) * 100) : 0;
  const q = questions[current];
  const isLast = current === total - 1;

  // ── Terminal states ────────────────────────────────────────────────────
  if (timedOut) {
    return (
      <div className="flex-1 px-10 pb-10 mt-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-16">
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-3xl p-16 backdrop-blur-[20px] shadow-[var(--shadow-sm)] text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
              >
                <TimerOff className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Time's Up!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Your allotted time has ended. Answers you saved have been recorded.
            </p>
            <p className="text-muted-foreground text-xs mb-8">Redirecting you to your exams…</p>
            <Link
              to="/exam"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:-translate-y-1 transition-all duration-300"
            >
              Back to Exams
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (terminated) {
    return (
      <div className="flex-1 px-10 pb-10 mt-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-16">
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-3xl p-16 backdrop-blur-[20px] shadow-[var(--shadow-sm)] text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <Ban className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Exam Terminated</h2>
            <p className="text-muted-foreground text-sm mb-2">
              You left the exam window {MAX_STRIKES} times. The exam has been terminated.
            </p>
            <p className="text-muted-foreground text-xs mb-8">Redirecting you to your exams…</p>
            <Link
              to="/exam"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:-translate-y-1 transition-all duration-300"
            >
              Back to Exams
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex-1 px-10 pb-10 mt-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-16">
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-3xl p-16 backdrop-blur-[20px] shadow-[var(--shadow-sm)] text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Exam Submitted!</h2>
            <p className="text-muted-foreground text-sm mb-8">
              You answered {answeredCount} of {total} questions. Your result is ready.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-muted-foreground border border-foreground/[0.15] hover:border-foreground/[0.3] hover:text-foreground hover:bg-white/[0.5] transition-all duration-200"
              >
                Back
              </Link>
              <button
                onClick={() =>
                  navigate(
                    `/exam/result?data=${encryptUrlData({ examallocationId, name: examName })}`,
                    { replace: true },
                  )
                }
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:-translate-y-1 transition-all duration-300"
              >
                See Result <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Focus-loss warning overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-md text-center shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Return to the exam!</h2>
              <p className="text-sm text-muted-foreground mb-5">
                You left the exam window. Come back within the countdown or you'll get a strike.{" "}
                {strikes > 0 && (
                  <>
                    You already have{" "}
                    <span className="font-bold text-red-500">{strikes}</span> of {MAX_STRIKES} strikes —{" "}
                  </>
                )}
                {MAX_STRIKES} strikes terminates the exam.
              </p>
              <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <span className="text-3xl font-bold text-red-500 tabular-nums">{cooldown}</span>
              </div>
              <p className="text-xs text-muted-foreground">Strike in {cooldown}s…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final-2-minutes reminder bar */}
      <AnimatePresence>
        {remainingMs != null && remainingMs > 0 && remainingMs <= 120_000 && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="sticky top-0 z-[90] flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-[13px] font-semibold text-center">
              Only <span className="tabular-nums font-bold">{formatTime(remainingMs)}</span> left — submit your answers now, or the exam will close automatically when the time runs out.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-10 pb-10">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/exam" className="hover:text-foreground transition-colors">Exam</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{examName || "Exam"}</span>
        </motion.div>

        {/* Header + progress */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">{examName || "Examination"}</h1>
                <p className="text-[11px] text-muted-foreground">Answer each question, then Save &amp; Next</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {strikes > 0 && (
                <div className="relative">
                  <motion.button
                    ref={strikeBtnRef}
                    type="button"
                    onClick={toggleStrikeInfo}
                    animate={{
                      scale: [1, 1.06, 1],
                      opacity: [1, 0.55, 1],
                      boxShadow: [
                        "0 0 0 0 hsl(0 84% 60% / 0.0)",
                        "0 0 0 4px hsl(0 84% 60% / 0.18)",
                        "0 0 0 0 hsl(0 84% 60% / 0.0)",
                      ],
                    }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 cursor-pointer hover:bg-red-500/20 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> {strikes}/{MAX_STRIKES} strikes
                  </motion.button>

                  {createPortal(
                    <AnimatePresence>
                      {showStrikeInfo && (
                        <>
                          {/* click-away layer */}
                          <div
                            className="fixed inset-0 z-[95]"
                            onClick={() => setShowStrikeInfo(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            style={{ top: strikePos?.top ?? 0, right: strikePos?.right ?? 0 }}
                            className="fixed z-[96] w-[min(18rem,calc(100vw-2.5rem))] origin-top-right rounded-2xl border border-white/[0.9] bg-white p-4 text-left shadow-2xl"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                              <p className="text-[13px] font-bold text-foreground">
                                {strikes} of {MAX_STRIKES} strikes used
                              </p>
                            </div>
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                              Leaving the exam — switching tabs, losing focus, or moving to another page — starts a {COOLDOWN_SECONDS}-second countdown. If you don't return in time, you get a strike.
                            </p>
                            <p className="text-[12px] text-muted-foreground leading-relaxed mt-2">
                              After <span className="font-semibold text-red-600">{MAX_STRIKES} strikes</span> the exam is terminated automatically. You have{" "}
                              <span className="font-semibold text-foreground">{Math.max(0, MAX_STRIKES - strikes)}</span>{" "}
                              {MAX_STRIKES - strikes === 1 ? "strike" : "strikes"} left.
                            </p>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>,
                    document.body,
                  )}
                </div>
              )}
              {remainingMs != null && (
                <span
                  ref={timerRef}
                  className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl tabular-nums transition-colors ${
                    remainingMs <= 60_000
                      ? "bg-red-500/15 text-red-600 animate-pulse"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Clock className="w-4 h-4" /> {formatTime(remainingMs)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-foreground">{answeredCount}/{total}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </motion.div>

        {loading ? (
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-8 backdrop-blur-[20px] shadow-[var(--shadow-sm)] animate-pulse">
            <div className="h-4 w-2/3 rounded bg-foreground/10 mb-8" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-foreground/[0.07]" />
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-12 text-center backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
            <p className="text-muted-foreground text-sm">This exam has no questions.</p>
            <Link to="/exam" className="inline-block mt-5 text-primary font-semibold text-sm">← Back to Exams</Link>
          </div>
        ) : (
          <>
            {/* Question navigator chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {questions.map((qq, idx) => {
                const isAnswered = !!qq.selected;
                const isCurrent = idx === current;
                // Can revisit the current/earlier questions or any already
                // answered one, but cannot skip ahead to an unanswered question.
                const locked = idx > current && !isAnswered;
                return (
                  <button
                    key={qq.id}
                    onClick={() => !locked && setCurrent(idx)}
                    disabled={locked}
                    title={locked ? "Answer the current question first" : undefined}
                    className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200 ${
                      isCurrent
                        ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-[var(--shadow-primary)]"
                        : isAnswered
                        ? "bg-green-500/15 text-green-700 hover:bg-green-500/25"
                        : locked
                        ? "bg-foreground/[0.04] text-muted-foreground/40 cursor-not-allowed"
                        : "bg-white/[0.6] text-muted-foreground border border-white/[0.88] hover:bg-white/[0.85]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Current question */}
            <div ref={questionCardRef} className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {current + 1}
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground leading-snug pt-1.5">
                    {q.title}
                  </h3>
                </div>

                <RadioGroup
                  value={q.selected}
                  onValueChange={setSelected}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                  {q.options.map((opt, i) => {
                    const isSelected = q.selected === opt;
                    return (
                      <label
                        key={`${q.id}-${i}`}
                        className={`group flex items-center gap-3 pl-3 pr-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.06] shadow-sm shadow-primary/10"
                            : "border-foreground/[0.06] bg-white/[0.3] hover:bg-white/[0.6] hover:border-foreground/[0.15]"
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 transition-all duration-200 ${
                            isSelected
                              ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-[var(--shadow-primary)]"
                              : "bg-foreground/[0.05] text-muted-foreground group-hover:bg-foreground/[0.08]"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span
                          className={`flex-1 text-[13.5px] break-words transition-colors ${
                            isSelected ? "text-foreground font-medium" : "text-foreground/80"
                          }`}
                        >
                          {opt}
                        </span>
                        <RadioGroupItem value={opt} className="shrink-0" />
                      </label>
                    );
                  })}
                </RadioGroup>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <button
                onClick={handleBack}
                disabled={current === 0 || saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-muted-foreground border border-foreground/[0.15] hover:border-foreground/[0.3] hover:text-foreground hover:bg-white/[0.5] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                ref={saveBtnRef}
                onClick={handleSaveNext}
                disabled={saving || !q.selected}
                title={!q.selected ? "Select an answer to continue" : undefined}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-primary)]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : isLast ? (
                  <>
                    <Save className="w-4 h-4" /> Save &amp; Finish
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save &amp; Next <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ExamDetail;
