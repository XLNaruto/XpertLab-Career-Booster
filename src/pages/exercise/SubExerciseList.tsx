import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { technologies } from "./ExerciseList";

export const exercisesByTech: Record<string, Array<{ id: string; title: string; desc: string; level: string; levelColor: string; time: string; rating: number; lessons: number }>> = {
  html: [
    { id: "html-1", title: "Semantic HTML Structure", desc: "Learn to use semantic tags for better accessibility and SEO", level: "Easy", levelColor: "bg-green-100 text-green-700", time: "30 min", rating: 4.8, lessons: 5 },
    { id: "html-2", title: "HTML Forms & Validation", desc: "Build complex forms with native validation attributes", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "45 min", rating: 4.7, lessons: 8 },
    { id: "html-3", title: "HTML5 Canvas Drawing", desc: "Create interactive graphics with the Canvas API", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "90 min", rating: 4.9, lessons: 12 },
    { id: "html-4", title: "Responsive Media Elements", desc: "Master picture, video, and audio elements", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "40 min", rating: 4.6, lessons: 6 },
  ],
  css: [
    { id: "css-1", title: "Flexbox Mastery", desc: "Complete guide to CSS Flexbox layout system", level: "Easy", levelColor: "bg-green-100 text-green-700", time: "35 min", rating: 4.9, lessons: 7 },
    { id: "css-2", title: "CSS Grid Advanced Layouts", desc: "Build complex grid-based responsive layouts", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "50 min", rating: 4.8, lessons: 10 },
    { id: "css-3", title: "CSS Animations & Transitions", desc: "Create smooth animations using keyframes & transitions", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "75 min", rating: 4.7, lessons: 9 },
  ],
  javascript: [
    { id: "js-1", title: "Async/Await Patterns", desc: "Working with Promises & async functions", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "45 min", rating: 4.8, lessons: 8 },
    { id: "js-2", title: "DOM Manipulation", desc: "Interact with the DOM using vanilla JavaScript", level: "Easy", levelColor: "bg-green-100 text-green-700", time: "40 min", rating: 4.6, lessons: 6 },
    { id: "js-3", title: "Closures & Scope", desc: "Deep dive into closures, scope chains & hoisting", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "60 min", rating: 4.9, lessons: 7 },
    { id: "js-4", title: "ES6+ Features", desc: "Destructuring, spread, modules, and more", level: "Easy", levelColor: "bg-green-100 text-green-700", time: "50 min", rating: 4.7, lessons: 10 },
    { id: "js-5", title: "Error Handling & Debugging", desc: "Try-catch, custom errors, debugging tools", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "35 min", rating: 4.5, lessons: 5 },
  ],
  react: [
    { id: "react-1", title: "React Hooks Deep Dive", desc: "useReducer + useContext patterns", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "60 min", rating: 4.9, lessons: 10 },
    { id: "react-2", title: "State Management", desc: "Redux Toolkit, Zustand, and Context API compared", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "90 min", rating: 4.8, lessons: 14 },
    { id: "react-3", title: "Component Patterns", desc: "HOCs, Render Props, and Compound Components", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "75 min", rating: 4.7, lessons: 9 },
  ],
  nodejs: [
    { id: "node-1", title: "REST API with Express", desc: "Build scalable APIs with Express.js", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "60 min", rating: 4.8, lessons: 11 },
    { id: "node-2", title: "Authentication & JWT", desc: "Implement secure auth with JSON Web Tokens", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "75 min", rating: 4.9, lessons: 8 },
  ],
  database: [
    { id: "db-1", title: "SQL Fundamentals", desc: "Master SELECT, JOIN, GROUP BY and subqueries", level: "Easy", levelColor: "bg-green-100 text-green-700", time: "45 min", rating: 4.7, lessons: 9 },
    { id: "db-2", title: "Database Design & Normalization", desc: "Design efficient schemas with proper normalization", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "55 min", rating: 4.6, lessons: 7 },
  ],
  mobile: [
    { id: "mob-1", title: "React Native Basics", desc: "Build cross-platform mobile apps", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "90 min", rating: 4.8, lessons: 15 },
  ],
  typescript: [
    { id: "ts-1", title: "TypeScript Generics", desc: "Master generic types, constraints, and utility types", level: "Hard", levelColor: "bg-primary/10 text-primary", time: "60 min", rating: 4.9, lessons: 8 },
    { id: "ts-2", title: "TypeScript with React", desc: "Type-safe components, hooks, and context", level: "Medium", levelColor: "bg-amber-100 text-amber-700", time: "55 min", rating: 4.8, lessons: 10 },
  ],
};

const SubExerciseList = () => {
  const { techId } = useParams();
  const navigate = useNavigate();
  const currentTech = technologies.find((t) => t.id === techId);
  const currentExercises = exercisesByTech[techId || ""] || [];

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
        <Link to="/exercises/technology" className="hover:text-foreground transition-colors">Exercises</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{currentTech?.name}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTech?.color} flex items-center justify-center text-white shadow-lg`}>
              {currentTech?.icon}
            </span>
            {currentTech?.name} Exercises
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{currentExercises.length} exercises available</p>
        </div>
        <button onClick={() => navigate("/exercises/technology")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-foreground/[0.15] hover:border-foreground/[0.3] hover:text-foreground hover:bg-white/[0.5] transition-all duration-200">
          ← All Technologies
        </button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
      >
        {currentExercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            variants={{
              hidden: { opacity: 0, y: 25, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
            }}
          >
            <Link
              to={`/exercises/details/${exercise.id}`}
              className="group flex flex-col h-full bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:bg-white/[0.85] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                {/* Number indicator */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTech?.color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                {/* Arrow */}
                <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </div>

              <h3 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">{exercise.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{exercise.desc}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SubExerciseList;
