import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle2, ChevronRight, FileText, ListChecks } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  { id: 1, question: "Which HTML tag is used to define an internal style sheet?", options: ["<css>", "<style>", "<script>", "<link>"] },
  { id: 2, question: "How would you rate the quality of course materials?", options: ["Excellent", "Good", "Average", "Below Average"] },
  { id: 3, question: "Which CSS property controls the text size?", options: ["font-style", "text-size", "font-size", "text-style"] },
  { id: 4, question: "Which method converts a JSON string into a JavaScript object?", options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.convert()"] },
  { id: 5, question: "Which hook is used to manage state in a React functional component?", options: ["useEffect", "useState", "useRef", "useMemo"] },
  { id: 6, question: "Which keyword declares a block-scoped variable in JavaScript?", options: ["var", "let", "function", "static"] },
  { id: 7, question: "What does the 'C' stand for in CSS?", options: ["Computed", "Cascading", "Colorful", "Class"] },
  { id: 8, question: "Which TypeScript type allows any value?", options: ["unknown", "void", "any", "never"] },
];

const Exam = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)]).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const handleChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => setSubmitted(true);

  return (
    <div className="flex-1 px-10 pb-10 mt-5">
      {submitted ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-16">
          <div className="bg-white/[0.6] border border-white/[0.88] rounded-3xl p-16 backdrop-blur-[20px] shadow-[var(--shadow-sm)] text-center relative overflow-hidden">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" as const, stiffness: 200, damping: 12, delay: 0.15 }}
                className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Exam Submitted!</h2>
            <p className="text-muted-foreground text-sm mb-8">
              You answered {answeredCount} of {questions.length} questions.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] hover:-translate-y-1 transition-all duration-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          {/* LEFT SIDEBAR */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed w-[400px] space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Exam</span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-tight">Examination</h1>
                  <p className="text-[11px] text-muted-foreground">Select the best answer</p>
                </div>
              </div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-foreground">{answeredCount}/{questions.length}</span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-1" />
              <p className="text-[10px] text-muted-foreground text-right">{progressPercent}% completed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-4 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Questions</p>
              <div className="space-y-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setActiveQuestion(idx);
                        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${activeQuestion === idx ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20" : "hover:bg-white/[0.5] border border-transparent"}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isAnswered ? "bg-gradient-to-br from-green-400 to-green-500" : "bg-gradient-to-br from-secondary to-secondary/70"}`}>
                        {isAnswered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <ListChecks className="w-3 h-3 text-white" />
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
            {questions.map((q, idx) => (
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-semibold text-foreground leading-snug">{q.question}</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 bg-secondary/10 text-secondary">
                    Single Choice
                  </span>
                </div>

                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(v) => handleChange(q.id, v)}
                  className="grid grid-cols-2 gap-2"
                >
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${answers[q.id] === opt ? "border-secondary/40 bg-secondary/[0.06] shadow-sm shadow-secondary/10" : "border-foreground/[0.06] bg-white/[0.3] hover:bg-white/[0.6] hover:border-foreground/[0.12]"}`}
                    >
                      <RadioGroupItem value={opt} />
                      <span className="text-[13px] text-foreground">{opt}</span>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            ))}

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
              <Send className="w-4 h-4" /> Submit Exam
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Exam;
