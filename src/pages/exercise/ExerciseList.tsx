import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Code2, Palette, Globe, Database, Smartphone, Server, Layers } from "lucide-react";
import { motion } from "framer-motion";

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

const ExerciseList = () => {
  const navigate = useNavigate();

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

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {technologies.map((tech) => (
          <motion.button
            key={tech.id}
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/exercises/list/${tech.id}`)}
            className="group bg-white/[0.6] border border-white/[0.88] rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:bg-white/[0.85] transition-all duration-300 text-left"
          >
            <motion.div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-white mb-4 shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {tech.icon}
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-1">{tech.name}</h3>
            <p className="text-sm text-muted-foreground">{tech.count} exercises available</p>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Explore <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default ExerciseList;
