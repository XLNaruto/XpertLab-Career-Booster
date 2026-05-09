import { toAbsoluteUrl } from "@/utils/reusable";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => (
  <motion.nav
    initial={{ y: -40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="relative flex items-center justify-between px-[60px] py-7 z-10"
  >
    <motion.img
      src={toAbsoluteUrl("media/logo/xllogo.png")}
      alt="XpertLab Career Booster"
      className="w-[120px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
    />
    <motion.div
      className="flex items-center gap-2.5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
    >
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <Link to="/login" className="block px-[22px] py-2.5 rounded-lg text-[13.5px] font-medium text-muted-foreground border border-foreground/[0.18] hover:border-foreground/[0.35] hover:text-foreground hover:bg-foreground/[0.04] transition-all duration-200">
          Sign In
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
        <Link to="/register" className="block px-[22px] py-2.5 rounded-lg text-[13.5px] font-semibold text-primary-foreground bg-gradient-to-br from-primary to-primary-light border-none shadow-[var(--shadow-primary)] hover:shadow-[0_8px_32px_hsl(342_80%_53%/0.42)] transition-all duration-200">
          Enroll Now
        </Link>
      </motion.div>
    </motion.div>
  </motion.nav>
);

export default Navbar;
