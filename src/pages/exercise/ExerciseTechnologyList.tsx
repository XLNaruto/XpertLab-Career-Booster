import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, ChevronLeft, Code2, Palette, Globe, Database, Smartphone, Server, Layers, BookOpen, CheckCircle2, PackageOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { encryptUrlData, toasterrormsg } from "@/utils/reusable";

export const technologies = [
  { id: "html", name: "HTML5", icon: <Globe className="w-6 h-6" />, count: 12, color: "from-orange-500 to-orange-600", bg: "bg-orange-500/10 text-orange-600" },
  { id: "css", name: "CSS3", icon: <Palette className="w-6 h-6" />, count: 15, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10 text-blue-600" },
  { id: "javascript", name: "JavaScript", icon: <Code2 className="w-6 h-6" />, count: 20, color: "from-yellow-500 to-amber-600", bg: "bg-yellow-500/10 text-yellow-700" },
  { id: "react", name: "React", icon: <Layers className="w-6 h-6" />, count: 18, color: "from-cyan-400 to-cyan-600", bg: "bg-cyan-500/10 text-cyan-600" },
  { id: "nodejs", name: "Node.js", icon: <Server className="w-6 h-6" />, count: 10, color: "from-green-500 to-green-700", bg: "bg-green-500/10 text-green-600" },
  { id: "database", name: "Database", icon: <Database className="w-6 h-6" />, count: 8, color: "from-purple-500 to-purple-700", bg: "bg-purple-500/10 text-purple-600" },
  { id: "mobile", name: "Mobile Dev", icon: <Smartphone className="w-6 h-6" />, count: 6, color: "from-pink-500 to-rose-600", bg: "bg-pink-500/10 text-pink-600" },
  { id: "typescript", name: "TypeScript", icon: <Code2 className="w-6 h-6" />, count: 14, color: "from-blue-600 to-indigo-700", bg: "bg-indigo-500/10 text-indigo-600" },
];

// Shape of a technology returned by the technologies API
type ApiTechnology = {
  technologyId: string;
  name: string;
  learningOrder: number;
  exerciseCount: number;
  completedCount: number;
};

// Cards per page before pagination kicks in
const PAGE_SIZE = 8;

// Single gradient + </> (Code2) icon used for all technology cards
const CARD_COLOR = "from-cyan-400 to-cyan-600";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

const ExerciseTechnologyList = () => {
  const navigate = useNavigate();
  const [technologyList, setTechnologyList] = useState<ApiTechnology[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const technologiesApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exercise/technologies",
      {},
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const list: ApiTechnology[] = response.data.data?.technologies || [];
      // Show in the intended learning order
      setTechnologyList(
        [...list].sort((a, b) => (a.learningOrder || 0) - (b.learningOrder || 0))
      );
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    technologiesApiCall();
  }, []);

  const totalPages = Math.max(1, Math.ceil(technologyList.length / PAGE_SIZE));

  // Keep the current page valid if the list shrinks
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedTechnologies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return technologyList.slice(start, start + PAGE_SIZE);
  }, [technologyList, currentPage]);

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
        <span className="text-foreground font-medium">Exercises</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-[28px] font-bold text-foreground">Choose a Technology</h1>
        <p className="text-muted-foreground text-sm mt-1">Select a technology to explore its exercises</p>
      </motion.div>

      {loading ? (
        // Skeleton loading grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="bg-white/[0.4] border border-white/[0.7] rounded-2xl p-6 animate-pulse"
            >
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 mb-4" />
              <div className="h-5 w-2/3 rounded bg-foreground/10 mb-2" />
              <div className="h-4 w-1/2 rounded bg-foreground/[0.07]" />
            </div>
          ))}
        </div>
      ) : technologyList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          {/* Animated icon with pulsing rings */}
          <div className="relative flex items-center justify-center mb-6">
            {[0, 1].map((ring) => (
              <motion.span
                key={ring}
                className="absolute rounded-full border border-secondary/30"
                initial={{ width: 88, height: 88, opacity: 0.5 }}
                animate={{ width: 150, height: 150, opacity: 0 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: ring * 1.2,
                }}
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

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold text-foreground mb-1.5"
          >
            No technologies yet
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm max-w-xs"
          >
            There are no technologies available to explore right now. Check back soon!
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard")}
            className="group mt-7 inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold text-foreground/80 bg-white/[0.6] border border-white/[0.88] backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:bg-white/[0.9] hover:text-foreground hover:shadow-[var(--shadow-md)] transition-all duration-300"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary group-hover:-translate-x-0.5 transition-transform duration-300">
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
            Back to Dashboard
          </motion.button>
        </motion.div>
      ) : (
        <>
          <motion.div
            key={currentPage}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {paginatedTechnologies.map((tech) => {
              const color = CARD_COLOR;
              const pct =
                tech.exerciseCount > 0
                  ? Math.round((tech.completedCount / tech.exerciseCount) * 100)
                  : 0;
              const isComplete = pct === 100;
              return (
                <motion.button
                  key={tech.technologyId}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    navigate(
                      `/exercises/list?data=${encryptUrlData({
                        technologyId: tech.technologyId,
                        name: tech.name,
                      })}`
                    )
                  }
                  className="group relative overflow-hidden bg-white/[0.6] border border-white/[0.88] rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:bg-white/[0.85] transition-all duration-300 text-left"
                >
                  {/* Soft gradient glow that reveals on hover */}
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.12] blur-2xl transition-opacity duration-500`}
                  />

                  <div className="relative flex items-start justify-between mb-4">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Code2 className="w-6 h-6" />
                    </motion.div>
                    {/* Completion badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isComplete
                          ? "bg-green-500/15 text-green-600"
                          : "bg-foreground/[0.05] text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {pct}%
                    </span>
                  </div>

                  <h3 className="relative text-lg font-bold text-foreground mb-3">{tech.name}</h3>

                  {/* Stats row */}
                  <div className="relative flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/[0.04] text-[11.5px] font-semibold text-foreground/70">
                      <BookOpen className="w-3.5 h-3.5" />
                      {tech.exerciseCount} {tech.exerciseCount === 1 ? "exercise" : "exercises"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/[0.08] text-[11.5px] font-semibold text-green-600">
                      {tech.completedCount} done
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative">
                    <div className="w-full h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      />
                    </div>
                  </div>

                  <div className="relative flex items-center gap-1.5 mt-4 text-xs font-semibold text-secondary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                    Explore exercises <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Pagination — only shown when there are more than PAGE_SIZE cards */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.88] bg-white/[0.6] text-muted-foreground hover:bg-white/[0.9] hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-md"
                        : "border border-white/[0.88] bg-white/[0.6] text-muted-foreground hover:bg-white/[0.9] hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.88] bg-white/[0.6] text-muted-foreground hover:bg-white/[0.9] hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExerciseTechnologyList;
