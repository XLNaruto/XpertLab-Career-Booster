import { FileText, Clock, BookOpen, Award } from "lucide-react";

const exams = [
  { id: "html-exam", title: "HTML5 Fundamentals", tech: "HTML5", questions: 25, duration: "45 min", difficulty: "Easy", diffColor: "bg-green-100 text-green-700", status: "Available", statusColor: "bg-secondary/10 text-secondary" },
  { id: "css-exam", title: "CSS3 & Responsive Design", tech: "CSS3", questions: 30, duration: "60 min", difficulty: "Medium", diffColor: "bg-amber-100 text-amber-700", status: "Available", statusColor: "bg-secondary/10 text-secondary" },
  { id: "js-exam", title: "JavaScript Core Concepts", tech: "JavaScript", questions: 40, duration: "90 min", difficulty: "Hard", diffColor: "bg-primary/10 text-primary", status: "Upcoming", statusColor: "bg-muted text-muted-foreground" },
  { id: "react-exam", title: "React & State Management", tech: "React", questions: 35, duration: "75 min", difficulty: "Hard", diffColor: "bg-primary/10 text-primary", status: "Completed", statusColor: "bg-green-100 text-green-700" },
  { id: "ts-exam", title: "TypeScript Advanced", tech: "TypeScript", questions: 30, duration: "60 min", difficulty: "Hard", diffColor: "bg-primary/10 text-primary", status: "Available", statusColor: "bg-secondary/10 text-secondary" },
  { id: "node-exam", title: "Node.js & Express APIs", tech: "Node.js", questions: 28, duration: "55 min", difficulty: "Medium", diffColor: "bg-amber-100 text-amber-700", status: "Upcoming", statusColor: "bg-muted text-muted-foreground" },
];

const Exam = () => {
  return (
    <div className="flex-1 px-10 pb-10">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
              <FileText className="w-7 h-7 text-secondary" /> Examinations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">View and take your scheduled exams</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
              <div>
                <div className="text-[13px] text-muted-foreground">Total Exams</div>
                <div className="text-2xl font-bold font-serif text-foreground">{exams.length}</div>
              </div>
            </div>
            <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center"><Award className="w-5 h-5" /></div>
              <div>
                <div className="text-[13px] text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold font-serif text-foreground">{exams.filter((e) => e.status === "Completed").length}</div>
              </div>
            </div>
            <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Clock className="w-5 h-5" /></div>
              <div>
                <div className="text-[13px] text-muted-foreground">Available Now</div>
                <div className="text-2xl font-bold font-serif text-foreground">{exams.filter((e) => e.status === "Available").length}</div>
              </div>
            </div>
          </div>

          {/* Exam cards */}
          <div className="grid grid-cols-2 gap-5">
            {exams.map((exam) => (
              <div key={exam.id} className="group bg-white/[0.6] border border-white/[0.88] rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:bg-white/[0.85] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">{exam.tech}</span>
                    <h3 className="text-[16px] font-bold text-foreground mt-2">{exam.title}</h3>
                  </div>
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${exam.statusColor}`}>{exam.status}</span>
                </div>

                <div className="flex items-center gap-5 text-[12.5px] text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{exam.questions} questions</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{exam.duration}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${exam.diffColor}`}>{exam.difficulty}</span>
                </div>

                {exam.status === "Available" ? (
                  <button className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_8px_32px_hsl(342_80%_53%/0.42)] hover:-translate-y-px transition-all duration-200">
                    Start Exam
                  </button>
                ) : exam.status === "Completed" ? (
                  <button className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-[0_8px_28px_hsl(207_65%_50%/0.3)] hover:-translate-y-px transition-all duration-200">
                    View Results
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-xl text-sm font-medium text-center text-muted-foreground bg-foreground/[0.03] border border-foreground/[0.08]">
                    Coming Soon
                  </div>
                )}
              </div>
            ))}
          </div>
    </div>
  );
};

export default Exam;
