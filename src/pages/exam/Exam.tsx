import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight, FileText, Play, RotateCw, CheckCircle2, Ban, Clock, ListChecks, PackageOpen, Sparkles, ArrowLeft, Loader2, Award } from "lucide-react";
import { motion } from "framer-motion";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { encryptUrlData, getEncodedCookie, toasterrormsg } from "@/utils/reusable";

// Shape of a single exam returned by the exam list API.
type ApiExam = {
  examallocationId: string;
  trainingexamId?: number;
  traineecourseId?: number;
  examName: string;
  level?: number;
  duration?: number; // minutes
  courseName?: string;
  status?: string; // ALLOCATED | STARTED | SUBMITTED | COMPLETED | TIMEOUT | TERMINATED
  totalQuestions?: number;
  totalMarks?: number;
  attemptedQuestions?: number;
  terminationStrike?: number;
};

type ExamListData = {
  exams: ApiExam[];
};

const emptyData: ExamListData = { exams: [] };

// Visual treatment for each exam status.
const statusMeta: Record<string, { label: string; className: string; icon: typeof Play }> = {
  ALLOCATED: { label: "Not Started", className: "bg-secondary/10 text-secondary", icon: Play },
  STARTED: { label: "In Progress", className: "bg-amber-400/15 text-amber-700", icon: RotateCw },
  SUBMITTED: { label: "Submitted", className: "bg-green-500/15 text-green-700", icon: CheckCircle2 },
  COMPLETED: { label: "Completed", className: "bg-green-500/15 text-green-700", icon: CheckCircle2 },
  TIMEOUT: { label: "Timed Out", className: "bg-orange-500/15 text-orange-700", icon: Clock },
  TERMINATED: { label: "Terminated", className: "bg-red-500/15 text-red-700", icon: Ban },
};

const Exam = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ExamListData>(emptyData);
  const [loading, setLoading] = useState(true);
  // examallocationId currently being started (to show a spinner on its button)
  const [startingId, setStartingId] = useState<string | null>(null);

  const examListApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exam/list",
      {},
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d = response.data.data || {};
      // The list payload arrives under `list` (array fallback for safety).
      const exams: ApiExam[] = Array.isArray(d) ? d : d.list || [];
      setData({ exams });
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    examListApiCall();
  }, []);

  const goToDetail = (exam: ApiExam) =>
    navigate(
      `/exam/details?data=${encryptUrlData({
        examallocationId: exam.examallocationId,
        name: exam.examName,
      })}`,
    );

  // Whether the exam-detail intro tour has already been shown today. When it
  // hasn't, the tour plays on the detail screen and the exam (STARTED + timer)
  // is begun only after it finishes — so the list defers the updateStatus call.
  const introSeenToday = () => {
    const traineeId = getEncodedCookie("traineeId") || "guest";
    const today = new Date().toISOString().slice(0, 10);
    return !!localStorage.getItem(`exam-intro-seen:${traineeId}:${today}`);
  };

  // Start (or resume) an exam.
  // - Already in progress (STARTED) → just navigate.
  // - Intro not seen yet → navigate without starting; the detail screen flags
  //   STARTED once the intro finishes (so the timer doesn't run during it).
  // - Intro already seen → flag STARTED here, then navigate (the timer starts).
  const handleStart = async (exam: ApiExam) => {
    if (startingId) return;
    if (exam.status === "STARTED" || !introSeenToday()) {
      goToDetail(exam);
      return;
    }
    setStartingId(exam.examallocationId);
    const response: any = await postData(
      "private/trainee/exam/updateStatus",
      { examallocationId: exam.examallocationId, status: "STARTED" },
      apiHeader(false, 2),
    );
    setStartingId(null);
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      goToDetail(exam);
    } else {
      toasterrormsg(response?.data?.message || "Unable to start the exam");
    }
  };

  const exams = data.exams;

  return (
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
        <span className="text-foreground font-medium">Exam</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white shadow-lg">
            <FileText className="w-5 h-5" />
          </span>
          Examinations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select an exam to begin. Once started, stay on this screen — leaving it repeatedly will terminate the exam.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/[0.4] border border-white/[0.7] rounded-2xl p-5 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-foreground/10 mb-4" />
              <div className="h-4 w-2/3 rounded bg-foreground/10 mb-3" />
              <div className="h-3 w-full rounded bg-foreground/[0.07] mb-2" />
              <div className="h-10 w-full rounded-xl bg-foreground/10 mt-5" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="relative flex items-center justify-center mb-6">
            {[0, 1].map((ring) => (
              <motion.span
                key={ring}
                className="absolute rounded-full border border-secondary/30"
                initial={{ width: 88, height: 88, opacity: 0.5 }}
                animate={{ width: 150, height: 150, opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: ring * 1.2 }}
              />
            ))}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-[88px] h-[88px] rounded-3xl bg-gradient-to-br from-secondary/15 to-secondary/5 border border-white/[0.6] flex items-center justify-center shadow-[var(--shadow-sm)]"
            >
              <PackageOpen className="w-10 h-10 text-secondary" strokeWidth={1.5} />
              <motion.span
                animate={{ scale: [1, 1.25, 1], rotate: [0, 15, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1.5 -right-1.5 text-amber-400"
              >
                <Sparkles className="w-5 h-5" />
              </motion.span>
            </motion.div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">No exams assigned yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            You don't have any exams to take right now. Check back soon!
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="group mt-7 inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold text-foreground/80 bg-white/[0.6] border border-white/[0.88] backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:bg-white/[0.9] hover:text-foreground hover:shadow-[var(--shadow-md)] transition-all duration-300"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary group-hover:-translate-x-0.5 transition-transform duration-300">
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
            Back to Dashboard
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {exams.map((exam, index) => {
            const status = exam.status || "ALLOCATED";
            const meta = statusMeta[status] || statusMeta.ALLOCATED;
            const StatusIcon = meta.icon;
            const canStart = status === "ALLOCATED" || status === "STARTED";
            const isStarting = startingId === exam.examallocationId;
            return (
              <motion.div
                key={exam.examallocationId}
                variants={{
                  hidden: { opacity: 0, y: 25, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
                }}
                className="group flex flex-col h-full bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${meta.className}`}>
                    <StatusIcon className="w-3 h-3" /> {meta.label}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-foreground mb-1">{exam.examName}</h3>
                {(exam.courseName || exam.level != null) && (
                  <p className="text-[12px] text-muted-foreground mb-3">
                    {[exam.courseName, exam.level != null ? `Level ${exam.level}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-[11px] mb-5 mt-auto pt-3">
                  {exam.totalQuestions != null && (
                    <span className="exam-metric-badge inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 font-bold text-sky-600">
                      <ListChecks className="w-3.5 h-3.5" /> <span className="font-bold tabular-nums">{exam.totalQuestions}</span> Questions
                    </span>
                  )}
                  {exam.duration != null && (
                    <span className="exam-metric-badge inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-bold text-amber-600" style={{ animationDelay: "0.15s" }}>
                      <Clock className="w-3.5 h-3.5" /> <span className="font-bold tabular-nums">{exam.duration}</span> min
                    </span>
                  )}
                  {exam.totalMarks != null && (
                    <span className="exam-metric-badge inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-600" style={{ animationDelay: "0.3s" }}>
                      <Award className="w-3.5 h-3.5" /> <span className="font-bold tabular-nums">{exam.totalMarks}</span> Marks
                    </span>
                  )}
                </div>

                <button
                  onClick={() => canStart && handleStart(exam)}
                  disabled={!canStart || isStarting}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    canStart
                      ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] disabled:opacity-70"
                      : "bg-foreground/[0.05] text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Starting…
                    </>
                  ) : status === "STARTED" ? (
                    <>
                      <RotateCw className="w-4 h-4" /> Resume Exam
                    </>
                  ) : status === "ALLOCATED" ? (
                    <>
                      <Play className="w-4 h-4" /> Start Exam
                    </>
                  ) : (
                    <>
                      <StatusIcon className="w-4 h-4" /> {meta.label}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Exam;
