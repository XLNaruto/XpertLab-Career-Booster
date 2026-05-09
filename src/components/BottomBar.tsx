import { motion } from "framer-motion";

const pills = ["HTML5", "CSS3", "JavaScript", "React", "Node.js", "Python", "Laravel","Flutter"];

const pillVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const BottomBar = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="relative z-10 px-[60px] py-6 flex items-center justify-between"
  >
    <div className="flex gap-2 flex-wrap">
      {pills.map((p, i) => (
        <motion.div
          key={p}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={pillVariants}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="px-3.5 py-[5px] rounded-full text-xs font-medium bg-white/[0.72] border border-foreground/10 text-muted-foreground shadow-[0_1px_4px_hsl(228_42%_12%/0.05)] hover:text-foreground hover:border-foreground/[0.22] hover:bg-white/[0.95] hover:shadow-[0_3px_12px_hsl(228_42%_12%/0.09)] transition-colors duration-200 cursor-default"
        >
          {p}
        </motion.div>
      ))}
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="text-xs text-muted-foreground"
    >
      © 2013 - {new Date().getFullYear()} XpertLab Technologies Private Limited
    </motion.div>
  </motion.div>
);

export default BottomBar;
