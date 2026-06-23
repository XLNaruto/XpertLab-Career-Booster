import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import {
  Send,
  CheckCircle2,
  ChevronRight,
  MessageSquareText,
  Loader2,
  Inbox,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

// Question type as returned by the feedback questions API.
type ApiQuestionType = "DESCRIPTION" | "OPTIONAL" | string;

// Shape of a single question from `private/trainee/feedback/questions`.
interface ApiQuestion {
  feedbackquestionId: string;
  question: string;
  type: ApiQuestionType;
  detail: string | string[];
  answer: string;
}

// Normalized type used to drive the UI.
type UiType = "descriptive" | "single";

interface Question {
  id: string;
  type: UiType;
  question: string;
  options: string[];
}

// Map the API question type to the UI type. DESCRIPTION is a free-text
// response; OPTIONAL is single choice.
const normalizeType = (type: ApiQuestionType): UiType => {
  const t = String(type || "").toUpperCase();
  if (t === "OPTIONAL" || t === "SINGLE" || t === "OPTION") return "single";
  return "descriptive";
};

// Convert a raw API question into the normalized shape the UI renders.
const toQuestion = (q: ApiQuestion): Question => {
  const type = normalizeType(q.type);
  const options =
    type === "descriptive"
      ? []
      : Array.isArray(q.detail)
        ? q.detail
        : q.detail
          ? [q.detail]
          : [];
  return {
    id: String(q.feedbackquestionId),
    type,
    question: q.question,
    options,
  };
};

const typeColors = {
  descriptive: "from-primary to-primary-light",
  single: "from-secondary to-secondary/70",
};

// Minimum characters required for a descriptive (written) answer.
const MIN_DESCRIPTIVE = 50;

const Feedback = () => {
  // Refresh the nav's feedback status (provided by MainLayout) after submit.
  const { refreshFeedbackStatus } = useOutletContext<{
    refreshFeedbackStatus?: () => void;
  }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  // Id of the question currently being submitted (one-by-one submit).
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  // Ids of questions whose answers are saved and therefore locked (read-only).
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  // Ids of unanswered questions to flash when the user tries to submit early.
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  const feedbackQuestionsApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/feedback/questions",
      {},
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      // If the trainee has already submitted feedback, there's nothing to
      // answer here — send them back to the dashboard (e.g. on refresh).
      if (data.isFeedbackSubmitted) {
        navigate("/dashboard", { replace: true });
        return;
      }
      const list: ApiQuestion[] = data.questions || [];
      setQuestions(list.map(toQuestion));
      // Seed any answers the API already has stored for this trainee.
      // Stored answers are locked (read-only) so they restore on refresh.
      const seeded: Record<string, string> = {};
      const lockedSeed = new Set<string>();
      list.forEach((q) => {
        if (q.answer) {
          const id = String(q.feedbackquestionId);
          seeded[id] = q.answer;
          lockedSeed.add(id);
        }
      });
      setAnswers(seeded);
      setLockedIds(lockedSeed);
      // Start on the first not-yet-answered question.
      const firstUnlocked = list.findIndex((q) => !q.answer);
      setActiveQuestion(firstUnlocked === -1 ? 0 : firstUnlocked);
      // If the trainee has already submitted, show the thank-you screen.
      if (data.submitted) setSubmitted(true);
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    feedbackQuestionsApiCall();
  }, []);

  const isAnswered = (v: string | undefined) => !!v && v.trim() !== "";

  // A descriptive answer must also meet the minimum length to be valid.
  const isValidAnswer = (q: Question, v: string | undefined) =>
    isAnswered(v) &&
    (q.type !== "descriptive" || (v || "").trim().length >= MIN_DESCRIPTIVE);

  const answeredCount = Object.keys(answers).filter((k) =>
    isAnswered(answers[k]),
  ).length;
  const progressPercent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const handleDescriptiveChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSingleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Submit a single question. We post the full array of all answered
  // questions (the existing API contract is unchanged) and lock this one.
  const handleQuestionSubmit = async (q: Question) => {
    if (!isValidAnswer(q, answers[q.id]) || lockedIds.has(q.id)) {
      // Flash the question border if it has no answer yet.
      setHighlightIds([q.id]);
      setTimeout(() => setHighlightIds([]), 1500);
      return;
    }
    setSubmittingId(q.id);
    // Submit only the current question's answer (one-by-one).
    const payload = {
      answers: [
        {
          feedbackquestionId: Number(q.id),
          answer: answers[q.id] || "",
        },
      ],
    };
    const response: any = await postData(
      "private/trainee/feedback/submit",
      payload,
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      toastsuccessmsg(response.data?.message || "Answer submitted");
      const nextLocked = new Set(lockedIds);
      nextLocked.add(q.id);
      setLockedIds(nextLocked);
      // Advance to the next unanswered question. Once every question is
      // answered, show the thank-you screen and refresh the nav.
      const nextIdx = questions.findIndex((qq) => !nextLocked.has(qq.id));
      if (nextIdx === -1) {
        setSubmitted(true);
        refreshFeedbackStatus?.();
      } else {
        setActiveQuestion(nextIdx);
      }
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setSubmittingId(null);
  };

  return (
    <div className="flex-1 px-10 pb-10 mt-5">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading feedback questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="max-w-md mx-auto mt-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.6] border border-white/[0.88] backdrop-blur-[20px] flex items-center justify-center mx-auto mb-5 shadow-[var(--shadow-sm)]">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            No feedback questions yet
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            There are no feedback questions available right now. Please check
            back later.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : submitted ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-3xl p-16 backdrop-blur-[20px] shadow-[var(--shadow-sm)] text-center relative overflow-hidden">
            {/* Confetti particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  y: -20,
                  x: Math.random() * 400 - 200,
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [0, 200 + Math.random() * 150],
                  x: (Math.random() - 0.5) * 300,
                  scale: [0, 1, 1, 0.5],
                  rotate: [0, Math.random() * 720 - 360],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: 0.3 + Math.random() * 0.5,
                  ease: "easeOut",
                }}
                className="absolute top-0 left-1/2 pointer-events-none"
                style={{
                  width: 8 + Math.random() * 8,
                  height: 8 + Math.random() * 8,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  background: [
                    "hsl(342,80%,53%)",
                    "hsl(210,70%,55%)",
                    "hsl(142,60%,50%)",
                    "hsl(45,90%,55%)",
                    "hsl(270,60%,55%)",
                  ][Math.floor(Math.random() * 5)],
                }}
              />
            ))}

            {/* Animated rings behind icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 2.2], opacity: [0, 0.3, 0] }}
                transition={{ duration: 1.2, delay: 0.1 }}
                className="absolute inset-0 rounded-full bg-green-400"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1.8], opacity: [0, 0.2, 0] }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute inset-0 rounded-full bg-green-400"
              />
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring" as const,
                  stiffness: 200,
                  damping: 12,
                  delay: 0.25,
                }}
                className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring" as const,
                stiffness: 300,
                damping: 20,
                delay: 0.5,
              }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Feedback Submitted!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="text-muted-foreground text-sm mb-8"
            >
              Thank you for helping us improve the training program.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring" as const,
                stiffness: 300,
                damping: 20,
                delay: 0.8,
              }}
            >
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] hover:-translate-y-1 transition-all duration-300"
              >
                Back to Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        (() => {
          const idx = Math.min(activeQuestion, questions.length - 1);
          const q = questions[idx];
          if (!q) return null;
          const flash = highlightIds.includes(q.id);
          const locked = lockedIds.has(q.id);
          const isSubmitting = submittingId === q.id;
          return (
            <div className="max-w-2xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                <Link
                  to="/dashboard"
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">Feedback</span>
              </div>

              {/* Header + progress */}
              <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-[var(--shadow-primary)]">
                    <MessageSquareText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground leading-tight">
                      Feedback
                    </h1>
                    <p className="text-[11px] text-muted-foreground">
                      Share your thoughts
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-foreground">
                    {answeredCount}/{questions.length}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2 mb-1" />
                <p className="text-[10px] text-muted-foreground text-right">
                  {progressPercent}% completed
                </p>
              </div>

              {/* Single active question */}
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 25, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring" as const,
                  stiffness: 300,
                  damping: 24,
                }}
                className={`bg-white/[0.6] border rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] transition-all duration-300 ${
                  flash
                    ? "border-red-300 animate-soft-blink"
                    : "border-primary/30 shadow-[0_4px_24px_hsl(342_80%_53%/0.08)]"
                }`}
              >
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Question {idx + 1} of {questions.length}
                </p>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeColors[q.type]} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-semibold text-foreground leading-snug">
                        {q.question}
                      </h3>
                    </div>
                  </div>
                  {locked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 bg-green-500/10 text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Submitted
                    </span>
                  )}
                  </div>

                  {q.type === "descriptive" &&
                    (locked ? (
                      <div className="w-full rounded-xl border border-foreground/[0.08] bg-white/[0.35] px-4 py-3 text-sm text-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {answers[q.id]}
                      </div>
                    ) : (
                      (() => {
                        const len = ((answers[q.id] as string) || "").trim()
                          .length;
                        const ok = len >= MIN_DESCRIPTIVE;
                        return (
                          <div>
                            <textarea
                              value={(answers[q.id] as string) || ""}
                              onChange={(e) => {
                                handleDescriptiveChange(q.id, e.target.value);
                                // Auto-grow: fit height to content, no scrollbar.
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              ref={(el) => {
                                // Size correctly on mount / when value restores.
                                if (el) {
                                  el.style.height = "auto";
                                  el.style.height = `${el.scrollHeight}px`;
                                }
                              }}
                              placeholder="Type your answer here..."
                              rows={3}
                              className="w-full min-h-[88px] overflow-hidden rounded-xl border border-foreground/[0.08] bg-white/[0.5] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none transition-all"
                            />
                            <div className="flex justify-end mt-1">
                              <span
                                className={`text-[11px] font-semibold tabular-nums ${
                                  ok ? "text-green-600" : "text-muted-foreground"
                                }`}
                              >
                                {len}/{MIN_DESCRIPTIVE}
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ))}

                  {q.type === "single" && q.options && (
                    <RadioGroup
                      value={(answers[q.id] as string) || ""}
                      onValueChange={(v) =>
                        !locked && handleSingleChange(q.id, v)
                      }
                      disabled={locked}
                      className={`grid grid-cols-2 gap-2 ${locked ? "pointer-events-none" : ""}`}
                    >
                      {q.options.map((opt) => {
                        const selected = (answers[q.id] as string) === opt;
                        if (locked && !selected) return null;
                        return (
                          <label
                            key={opt}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${locked ? "cursor-default" : "cursor-pointer"} ${selected ? "border-secondary/40 bg-secondary/[0.06] shadow-sm shadow-secondary/10" : "border-foreground/[0.06] bg-white/[0.3] hover:bg-white/[0.6] hover:border-foreground/[0.12]"}`}
                          >
                            <RadioGroupItem value={opt} />
                            <span className="text-[13px] text-foreground">
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {!locked && (
                    <div className="flex justify-end mt-4">
                      <motion.button
                        whileHover={isSubmitting ? {} : { y: -2, scale: 1.02 }}
                        whileTap={isSubmitting ? {} : { scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionSubmit(q);
                        }}
                        disabled={isSubmitting || !isValidAnswer(q, answers[q.id])}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Submit
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
              </motion.div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default Feedback;
