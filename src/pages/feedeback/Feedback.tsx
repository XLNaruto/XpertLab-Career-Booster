import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle2, ChevronRight, MessageSquareText, PenLine, ListChecks, CheckSquare } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface Question {
  id: number;
  type: "descriptive" | "single" | "multiple";
  question: string;
  options?: string[];
}

const questions: Question[] = [
  { id: 1, type: "descriptive", question: "How would you describe your overall learning experience so far?" },
  { id: 2, type: "single", question: "How would you rate the quality of course materials?", options: ["Excellent", "Good", "Average", "Below Average"] },
  { id: 3, type: "descriptive", question: "What improvements would you suggest for the exercises?" },
  { id: 4, type: "multiple", question: "Which topics would you like to see more exercises on?", options: ["React Hooks", "TypeScript Generics", "CSS Animations", "Node.js APIs", "Database Design"] },
  { id: 5, type: "single", question: "How helpful are the instructor's explanations?", options: ["Very Helpful", "Helpful", "Somewhat Helpful", "Not Helpful"] },
  { id: 6, type: "descriptive", question: "Share any additional feedback or suggestions for the training program." },
  { id: 7, type: "multiple", question: "Which learning formats do you prefer?", options: ["Video Tutorials", "Written Guides", "Hands-on Exercises", "Live Sessions"] },
  { id: 8, type: "single", question: "Would you recommend this program to others?", options: ["Definitely Yes", "Probably Yes", "Not Sure", "Probably Not"] },
];

const typeIcons = {
  descriptive: PenLine,
  single: ListChecks,
  multiple: CheckSquare,
};

const typeColors = {
  descriptive: "from-primary to-primary-light",
  single: "from-secondary to-secondary/70",
  multiple: "from-[hsl(270,60%,55%)] to-[hsl(290,50%,60%)]",
};

const typeBadge = {
  descriptive: { label: "Written Response", bg: "bg-primary/10 text-primary" },
  single: { label: "Single Choice", bg: "bg-secondary/10 text-secondary" },
  multiple: { label: "Multiple Choice", bg: "bg-[hsl(270,60%,55%)]/10 text-[hsl(270,60%,55%)]" },
};

const Feedback = () => {
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[Number(k)];
    return v && (typeof v === "string" ? v.trim() !== "" : v.length > 0);
  }).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const handleDescriptiveChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSingleChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleMultipleToggle = (id: number, option: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) || [];
      return { ...prev, [id]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option] };
    });
  };

  const handleSubmit = () => setSubmitted(true);

  return (
    <div className="flex-1 px-10 pb-10 mt-5">
          {submitted ? (
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
                    initial={{ opacity: 0, y: -20, x: Math.random() * 400 - 200, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [0, 200 + Math.random() * 150],
                      x: (Math.random() - 0.5) * 300,
                      scale: [0, 1, 1, 0.5],
                      rotate: [0, Math.random() * 720 - 360],
                    }}
                    transition={{ duration: 2 + Math.random(), delay: 0.3 + Math.random() * 0.5, ease: "easeOut" }}
                    className="absolute top-0 left-1/2 pointer-events-none"
                    style={{
                      width: 8 + Math.random() * 8,
                      height: 8 + Math.random() * 8,
                      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                      background: ["hsl(342,80%,53%)", "hsl(210,70%,55%)", "hsl(142,60%,50%)", "hsl(45,90%,55%)", "hsl(270,60%,55%)"][Math.floor(Math.random() * 5)],
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
                    transition={{ type: "spring" as const, stiffness: 200, damping: 12, delay: 0.25 }}
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
                  transition={{ type: "spring" as const, stiffness: 300, damping: 20, delay: 0.5 }}
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
                  transition={{ type: "spring" as const, stiffness: 300, damping: 20, delay: 0.8 }}
                >
                  <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] hover:-translate-y-1 transition-all duration-300">
                    Back to Dashboard
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="relative">
              {/* LEFT SIDEBAR - Progress Tracker (fixed) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed w-[400px] space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-foreground font-medium">Feedback</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-[var(--shadow-primary)]">
                      <MessageSquareText className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-foreground leading-tight">Feedback</h1>
                      <p className="text-[11px] text-muted-foreground">Share your thoughts</p>
                    </div>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-foreground">{answeredCount}/{questions.length}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2 mb-1" />
                  <p className="text-[10px] text-muted-foreground text-right">{progressPercent}% completed</p>
                </motion.div>

                {/* Question Navigator */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-4 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
                >
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Questions</p>
                  <div className="space-y-1.5">
                    {questions.map((q, idx) => {
                      const isAnswered = answers[q.id] && (typeof answers[q.id] === "string" ? (answers[q.id] as string).trim() !== "" : (answers[q.id] as string[]).length > 0);
                      const Icon = typeIcons[q.type];
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setActiveQuestion(idx);
                            document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${activeQuestion === idx ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20" : "hover:bg-white/[0.5] border border-transparent"}`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isAnswered ? "bg-gradient-to-br from-green-400 to-green-500" : `bg-gradient-to-br ${typeColors[q.type]}`}`}>
                            {isAnswered ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Icon className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`text-[12px] leading-tight line-clamp-2 ${activeQuestion === idx ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                            Q{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT - Questions */}
              <motion.div
                className="ml-[450px] pt-9 space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
              >
                {questions.map((q, idx) => {
                  const badge = typeBadge[q.type];
                  return (
                    <motion.div
                      key={q.id}
                      id={`q-${q.id}`}
                      variants={{
                        hidden: { opacity: 0, y: 25, scale: 0.97 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
                      }}
                      onClick={() => setActiveQuestion(idx)}
                      className={`bg-white/[0.6] border rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] transition-all duration-300 cursor-pointer ${activeQuestion === idx ? "border-primary/30 shadow-[0_4px_24px_hsl(342_80%_53%/0.08)]" : "border-white/[0.88] hover:border-primary/15"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeColors[q.type]} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="text-[14.5px] font-semibold text-foreground leading-snug">{q.question}</h3>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      {q.type === "descriptive" && (
                        <textarea
                          value={(answers[q.id] as string) || ""}
                          onChange={(e) => handleDescriptiveChange(q.id, e.target.value)}
                          placeholder="Type your answer here..."
                          rows={3}
                          className="w-full rounded-xl border border-foreground/[0.08] bg-white/[0.5] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none transition-all"
                        />
                      )}

                      {q.type === "single" && q.options && (
                        <RadioGroup value={(answers[q.id] as string) || ""} onValueChange={(v) => handleSingleChange(q.id, v)} className="grid grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${(answers[q.id] as string) === opt ? "border-secondary/40 bg-secondary/[0.06] shadow-sm shadow-secondary/10" : "border-foreground/[0.06] bg-white/[0.3] hover:bg-white/[0.6] hover:border-foreground/[0.12]"}`}>
                              <RadioGroupItem value={opt} />
                              <span className="text-[13px] text-foreground">{opt}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      )}

                      {q.type === "multiple" && q.options && (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt) => {
                            const selected = ((answers[q.id] as string[]) || []).includes(opt);
                            return (
                              <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${selected ? "border-[hsl(270,60%,55%)]/30 bg-[hsl(270,60%,55%)]/[0.06] shadow-sm shadow-[hsl(270,60%,55%)]/10" : "border-foreground/[0.06] bg-white/[0.3] hover:bg-white/[0.6] hover:border-foreground/[0.12]"}`}>
                                <Checkbox checked={selected} onCheckedChange={() => handleMultipleToggle(q.id, opt)} />
                                <span className="text-[13px] text-foreground">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
                  }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-xl text-sm font-bold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit Feedback
                </motion.button>
              </motion.div>
            </div>
          )}
    </div>
  );
};

export default Feedback;
