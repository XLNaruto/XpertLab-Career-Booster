import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Award,
  Target,
  Clock,
  ListChecks,
  MinusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { decryptUrlData, toasterrormsg } from "@/utils/reusable";

// ── Types from private/trainee/exam/result ──────────────────────────────
type ResultOption = { text: string; isCorrect: boolean };
type ResultQuestion = {
  trainingexamquestionId: string;
  title: string;
  options: ResultOption[];
  attempted: boolean;
  givenAnswer: string;
  isCorrect: boolean;
  submittedAt: string;
};
type ExamResultData = {
  exam?: {
    name?: string;
    description?: string;
    level?: number;
    duration?: number;
    courseName?: string;
  };
  status?: string;
  startedAt?: string;
  submittedAt?: string;
  totalQuestions?: number;
  totalMarks?: number;
  obtainedMarks?: number;
  attemptedQuestions?: number;
  terminationStrike?: number;
  questions?: ResultQuestion[];
};

// Seconds spent on the result page before auto-redirecting to the dashboard.
const REDIRECT_SECONDS = 60;

// Render a "12m 04s" style duration between two ISO timestamps.
const formatDuration = (start?: string, end?: string): string => {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${m}m ${pad(s)}s`;
};

const ExamResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { examallocationId = "", name = "" } = decryptUrlData(searchParams.get("data"));

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_SECONDS);
  // Height of the layout's sticky top nav, so the countdown bar can dock flush
  // under it (the nav is translucent, so any overlap/gap shows through).
  const [navHeight, setNavHeight] = useState(0);

  const examResultApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exam/result",
      { examallocationId },
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      setResult(response.data.data || null);
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (examallocationId) examResultApiCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examallocationId]);

  // Measure the layout's sticky nav so the countdown bar docks exactly under it.
  useEffect(() => {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const measure = () => setNavHeight(nav.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // Auto-redirect to the dashboard REDIRECT_SECONDS after first landing on the
  // result page. The deadline is persisted per exam so a page refresh resumes
  // the same countdown instead of restarting it.
  useEffect(() => {
    if (!examallocationId) return;
    const key = `exam-result-redirect:${examallocationId}`;
    let deadline = Number(sessionStorage.getItem(key));
    if (!deadline || Number.isNaN(deadline) || deadline <= Date.now()) {
      // First visit (or a stale deadline) → start a fresh countdown.
      deadline = Date.now() + REDIRECT_SECONDS * 1000;
      sessionStorage.setItem(key, String(deadline));
    }
    const tick = () => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        sessionStorage.removeItem(key);
        navigate("/dashboard");
        return;
      }
      setRedirectIn(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [examallocationId, navigate]);

  const examName = result?.exam?.name || name;
  const questions = result?.questions || [];

  const stats = useMemo(() => {
    const total = result?.totalQuestions ?? questions.length;
    const totalMarks = result?.totalMarks ?? total;
    const obtained = result?.obtainedMarks ?? 0;
    const attempted = result?.attemptedQuestions ?? questions.filter((q) => q.attempted).length;
    const correct = questions.filter((q) => q.isCorrect).length;
    const wrong = questions.filter((q) => q.attempted && !q.isCorrect).length;
    const unattempted = total - attempted;
    const percent = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0;
    return { total, totalMarks, obtained, attempted, correct, wrong, unattempted, percent };
  }, [result, questions]);

  // Pass threshold (no server flag in the payload yet) — 35%.
  const passed = stats.percent >= 35;

  return (
    <div className="flex-1 px-10 pb-10">
      {/* Auto-redirect countdown bar */}
      <AnimatePresence>
        {redirectIn > 0 && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ top: navHeight }}
            className="sticky z-40 -mx-10 mb-5 flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white shadow-lg"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <p className="text-[13px] font-semibold text-center">
              Back to your dashboard in{" "}
              <span className="tabular-nums font-bold">{redirectIn}s</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
        <span className="text-foreground font-medium">{examName || "Result"}</span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] mb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{examName || "Exam Result"}</h1>
            <p className="text-[11px] text-muted-foreground">
              {result?.exam?.courseName ? `${result.exam.courseName} • ` : ""}Exam Result
            </p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-12 text-center backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm mt-3">Loading your result…</p>
        </div>
      ) : !result ? (
        <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-12 text-center backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
          <p className="text-muted-foreground text-sm">No result found for this exam.</p>
          <Link to="/exam" className="inline-block mt-5 text-primary font-semibold text-sm">← Back to Exams</Link>
        </div>
      ) : (
        <>
          {/* Score summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)] mb-5"
          >
            <div className="flex flex-col sm:flex-row items-center gap-7">
              {/* Score ring */}
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--foreground) / 0.07)" strokeWidth="10" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={passed ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - stats.percent / 100) }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-foreground tabular-nums leading-none">{stats.percent}%</span>
                  <span className="text-[11px] text-muted-foreground mt-1">Score</span>
                </div>
              </div>

              {/* Right side */}
              <div className="flex-1 w-full text-center sm:text-left">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    passed ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-600"
                  }`}
                >
                  {passed ? <Award className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                  {passed ? "Passed" : "Fail"}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {stats.obtained} <span className="text-muted-foreground font-medium text-lg">/ {stats.totalMarks} marks</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  You answered <span className="font-semibold text-green-600">{stats.correct}</span> of {stats.total} questions correctly.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stat tiles */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {[
              { icon: CheckCircle2, label: "Correct", value: stats.correct, color: "text-green-600", bg: "bg-green-500/12" },
              { icon: XCircle, label: "Wrong", value: stats.wrong, color: "text-red-600", bg: "bg-red-500/12" },
              { icon: MinusCircle, label: "Unattempted", value: stats.unattempted, color: "text-amber-600", bg: "bg-amber-500/12" },
              { icon: Clock, label: "Time Taken", value: formatDuration(result.startedAt, result.submittedAt), color: "text-primary", bg: "bg-primary/12" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-4 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight tabular-nums truncate">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:-translate-y-1 transition-all duration-300"
            >
              Back
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamResult;
