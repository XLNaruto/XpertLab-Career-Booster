import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import WelcomePopup from "@/components/WelcomePopup";
import { CalendarDays, CheckCircle2, XCircle, TrendingUp, Clock, Star, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, momentLocalizer, type ToolbarProps } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Holiday list data
const holidays = [
  { date: "Jan 26", name: "Republic Day" },
  { date: "Mar 14", name: "Holi" },
  { date: "Mar 31", name: "Id-ul-Fitr" },
  { date: "Apr 10", name: "Mahavir Jayanti" },
  { date: "Apr 14", name: "Ambedkar Jayanti" },
  { date: "Apr 18", name: "Good Friday" },
  { date: "May 1", name: "May Day" },
  { date: "Jun 7", name: "Id-ul-Adha" },
  { date: "Jul 6", name: "Muharram" },
  { date: "Aug 15", name: "Independence Day" },
  { date: "Aug 16", name: "Janmashtami" },
  { date: "Sep 5", name: "Milad-un-Nabi" },
  { date: "Oct 2", name: "Gandhi Jayanti" },
  { date: "Oct 20", name: "Dussehra" },
  { date: "Nov 9", name: "Diwali" },
  { date: "Nov 15", name: "Guru Nanak Jayanti" },
  { date: "Dec 25", name: "Christmas" },
];

// Attendance summary cards data
const attendanceStats = [
  { label: "Total Days", value: "68", icon: <CalendarDays className="w-5 h-5" />, iconBg: "bg-secondary/10 text-secondary" },
  { label: "Present Days", value: "59", icon: <CheckCircle2 className="w-5 h-5" />, iconBg: "bg-green-500/10 text-green-500" },
  { label: "Absent Days", value: "9", icon: <XCircle className="w-5 h-5" />, iconBg: "bg-primary/10 text-primary" },
  { label: "Extra Days", value: "3", icon: <Star className="w-5 h-5" />, iconBg: "bg-amber-500/10 text-amber-500" },
];

// Course-wise exercise progress
const courses = [
  { name: "HTML", exercises: 12, completed: 10 },
  { name: "CSS", exercises: 15, completed: 11 },
  { name: "JavaScript", exercises: 20, completed: 14 },
  { name: "React", exercises: 18, completed: 8 },
  { name: "TypeScript", exercises: 10, completed: 4 },
  { name: "Tailwind CSS", exercises: 8, completed: 5 },
];

// Aggregate exercise totals
const totalExercises = courses.reduce((sum, c) => sum + c.exercises, 0);
const totalCompleted = courses.reduce((sum, c) => sum + c.completed, 0);

// react-big-calendar localizer
const localizer = momentLocalizer(moment);

// Dates when the student was present (Feb 2026)
const presentDates = new Set([
  "2026-02-03", "2026-02-04", "2026-02-05", "2026-02-06", "2026-02-08", "2026-02-09",
  "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13",
  "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27",
]);

// Typewriter text reveal hook
const useTypewriter = (text: string, speed = 60, delay = 300) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
};

// Animated stat card with count-up
const CountUpCard = ({ stat, index }: { stat: typeof attendanceStats[number]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const target = parseInt(stat.value);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: 0.15 * index, ease: "easeOut" }}
      className="bg-white/[0.5] border border-white/[0.85] rounded-xl p-3 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={isInView ? { scale: 1, rotate: 0 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 + 0.15 * index }}
        className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.iconBg}`}
      >
        {stat.icon}
      </motion.div>
      <div className="text-[22px] font-bold font-serif text-foreground leading-none">{count}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{stat.label}</div>
    </motion.div>
  );
};

// Custom toolbar with chevron icons
const CustomToolbar = ({ label, onNavigate }: { label: string; onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void }) => (
  <div className="flex items-center justify-center gap-3 mb-4">
    <button
      onClick={() => onNavigate("PREV")}
      className="p-1.5 rounded-lg hover:bg-foreground/[0.05] text-muted-foreground transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <button
      onClick={() => onNavigate("NEXT")}
      className="p-1.5 rounded-lg hover:bg-foreground/[0.05] text-muted-foreground transition-colors"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

// Attendance calendar using react-big-calendar
const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 27)); // Feb 27, 2026

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const components = useMemo(() => ({
    toolbar: (props: ToolbarProps) => <CustomToolbar label={props.label} onNavigate={props.onNavigate} />,
    month: {
      dateHeader: ({ date, label }: { date: Date; label: string }) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        const cellMonth = moment(date).month();
        const viewMonth = moment(currentDate).month();
        const isOutside = cellMonth !== viewMonth;
        const isToday = moment(date).isSame(new Date(2026, 1, 27), "day");
        const isPresent = presentDates.has(dateStr);

        let bg = "transparent";
        let shadow = "none";
        let color = "hsl(var(--foreground) / 0.6)";

        if (isOutside) {
          color = "hsl(var(--foreground) / 0.2)";
        } else if (isToday) {
          bg = "linear-gradient(to bottom right, hsl(var(--secondary)), hsl(var(--secondary) / 0.8))";
          shadow = "0 4px 16px hsl(207 65% 50% / 0.3)";
          color = "white";
        } else if (isPresent) {
          bg = "rgb(220 252 231)";
          color = "rgb(21 128 61)";
        }

        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: bg,
              boxShadow: shadow,
              borderRadius: "8px",
              color,
              fontWeight: isToday || isPresent ? 600 : 500,
              fontSize: "13px",
            }}
          >
            {label}
          </div>
        );
      },
    },
  }), [currentDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <style>{`
        /* ===== Month view — flex column so rows share space ===== */
        .attendance-calendar .rbc-month-view {
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
        }

        /* ===== Day-of-week headers ===== */
        .attendance-calendar .rbc-header {
          border: none !important;
          padding: 8px 0;
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          text-align: center;
        }
        .attendance-calendar .rbc-header + .rbc-header {
          border-left: none !important;
        }
        .attendance-calendar .rbc-row.rbc-month-header {
          margin-bottom: 4px;
        }

        /* ===== Month rows — stretch to fill ===== */
        .attendance-calendar .rbc-month-row {
          border: none !important;
          overflow: visible;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .attendance-calendar .rbc-month-row + .rbc-month-row {
          border-top: none !important;
        }

        /* ===== Hide background layer ===== */
        .attendance-calendar .rbc-row-bg {
          display: none !important;
        }

        /* ===== Row content — stretch to fill month row ===== */
        .attendance-calendar .rbc-row-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        /* Hide event rows */
        .attendance-calendar .rbc-row-content .rbc-row:not(:first-child) {
          display: none;
        }
        /* Date row — flex to fill and layout cells ===== */
        .attendance-calendar .rbc-row-content .rbc-row:first-child {
          display: flex;
          flex: 1;
          gap: 6px;
          padding: 3px 0;
        }

        /* ===== Date cells ===== */
        .attendance-calendar .rbc-date-cell {
          flex: 1;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          text-align: center;
          padding: 0;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .attendance-calendar .rbc-date-cell > a,
        .attendance-calendar .rbc-date-cell > button {
          pointer-events: none;
          text-decoration: none;
          font-weight: inherit;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* ===== Off-range (outside month) ===== */
        .attendance-calendar .rbc-off-range {
          color: hsl(var(--foreground) / 0.2) !important;
        }
        .attendance-calendar .rbc-off-range a {
          color: hsl(var(--foreground) / 0.2) !important;
        }

        /* ===== Hide events ===== */
        .attendance-calendar .rbc-row-segment { padding: 0; }
        .attendance-calendar .rbc-event { display: none; }
        .attendance-calendar .rbc-show-more { display: none; }
      `}</style>
      <div className="attendance-calendar">
        <Calendar
          localizer={localizer}
          date={currentDate}
          onNavigate={handleNavigate}
          views={["month"]}
          defaultView="month"
          toolbar={true}
          style={{ height: 400 }}
          components={components}
          events={[]}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.6 }}
        className="flex items-center gap-5 mt-4 pt-3 border-t border-foreground/[0.06]"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          <span className="text-[11px] text-muted-foreground">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="text-[11px] text-muted-foreground">Today</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main dashboard page component
const Dashboard = () => {
  const greeting = "Good morning, Sarah";
  const { displayed, done } = useTypewriter(greeting, 55, 400);
  const attendanceRef = useRef<HTMLDivElement>(null);
  const [attendanceHeight, setAttendanceHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!attendanceRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setAttendanceHeight(entry.contentRect.height + 56); // +56 for p-7 (28px * 2)
    });
    observer.observe(attendanceRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <WelcomePopup />
      <div className="flex-1 px-10 pb-10">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-foreground">
              {displayed}
              <motion.span
                animate={{ opacity: done ? 0 : [1, 0] }}
                transition={done ? { duration: 0.3 } : { repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                className="inline-block w-[3px] h-[28px] bg-primary ml-0.5 align-middle rounded-full"
              />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: done ? 1 : 0, y: done ? 0 : 8 }}
              transition={{ duration: 0.5 }}
              className="text-muted-foreground text-sm"
            >
              Here's your training progress overview
            </motion.p>
          </div>

          {/* Notices */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-secondary/[0.08] border border-secondary/20 rounded-2xl p-5 backdrop-blur-[20px] flex items-start gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.9 }}
                className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5"
              >
                <Clock className="w-5 h-5 text-secondary" />
              </motion.div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-foreground mb-1">Training Progress</h3>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">You have completed <span className="font-semibold text-secondary">30 out of 90 days</span> of the training program. Only <span className="font-semibold text-secondary">60 days remaining</span> to complete the training.</p>
                <div className="mt-3 w-full h-2 rounded-full bg-secondary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "33%" }}
                    transition={{ duration: 1.2, delay: 1.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary/70"
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="text-[11px] text-muted-foreground mt-1.5"
                >
                  33% completed
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="bg-primary/[0.06] border border-primary/20 rounded-2xl p-5 backdrop-blur-[20px] flex items-start gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.05 }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"
              >
                <TrendingUp className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-foreground mb-1">Fee Payment Status</h3>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">Total fee: <span className="font-semibold text-foreground">₹12,000</span>. Paid: <span className="font-semibold text-secondary">₹1,000</span>. Remaining: <span className="font-semibold text-primary">₹11,000</span> — please pay as soon as possible to continue your training.</p>
                <div className="mt-3 w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "8.3%" }}
                    transition={{ duration: 1, delay: 1.25, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.9 }}
                  className="text-[11px] text-muted-foreground mt-1.5"
                >
                  8% paid
                </motion.p>
              </div>
            </motion.div>
          </div>

          {/* Two Analysis Grids */}
          <div className="grid grid-cols-2 gap-5">
            {/* 1. Attendance Analysis */}
            <motion.div
              ref={attendanceRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center justify-between mb-5">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-lg font-bold text-foreground"
                >
                  Attendance Analysis
                </motion.h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/80 transition-colors"
                    >
                      <PartyPopper className="w-3.5 h-3.5" />
                      Holidays
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg">
                        <PartyPopper className="w-5 h-5 text-primary" />
                        Holiday List — 2026
                      </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1">
                      <div className="divide-y divide-border">
                        {holidays.map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * i }}
                            className="flex items-center justify-between py-3 px-1"
                          >
                            <span className="text-sm font-medium text-foreground">{h.name}</span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{h.date}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center mt-1">Total {holidays.length} holidays this year</p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Attendance Stats */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {attendanceStats.map((s, i) => (
                  <CountUpCard key={s.label} stat={s} index={i} />
                ))}
              </div>

              {/* Calendar */}
              <AttendanceCalendar />
            </motion.div>

            {/* 2. Training Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex flex-col"
              style={attendanceHeight ? { height: attendanceHeight } : undefined}
            >
              <div className="flex items-center justify-between mb-5">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="text-lg font-bold text-foreground"
                >
                  Training Analysis
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <Link to="/exercises" className="text-xs font-semibold text-secondary hover:opacity-80 transition-opacity relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-secondary after:transition-all after:duration-300 hover:after:w-full">View all →</Link>
                </motion.div>
              </div>

              {/* Overall Progress */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="bg-secondary/[0.08] border border-secondary/20 rounded-xl p-4 mb-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.9 }}
                      className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center"
                    >
                      <TrendingUp className="w-5 h-5 text-secondary" />
                    </motion.div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">Overall Progress</div>
                      <div className="text-[11px] text-muted-foreground">{totalCompleted} of {totalExercises} exercises completed</div>
                    </div>
                  </div>
                  <div className="text-[22px] font-bold font-serif text-secondary">{Math.round((totalCompleted / totalExercises) * 100)}%</div>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalCompleted / totalExercises) * 100}%` }}
                    transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary/70"
                  />
                </div>
              </motion.div>

              {/* Courses List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1 }}
                className="text-[13px] font-semibold text-foreground mb-3"
              >
                Courses ({courses.length})
              </motion.div>
              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 -mr-1">
                {courses.map((c, i) => {
                  const pct = Math.round((c.completed / c.exercises) * 100);
                  return (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 1.1 + i * 0.1 }}
                      className="bg-white/[0.55] border border-white/[0.85] rounded-xl p-3.5 hover:bg-white/[0.8] hover:shadow-[var(--shadow-sm)] transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.2 + i * 0.1 }}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-[11px] font-bold text-primary"
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </motion.div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground">{c.completed}/{c.exercises} exercises</div>
                          </div>
                        </div>
                        <span className={`text-[12px] font-bold ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-secondary' : 'text-primary'}`}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 1.3 + i * 0.1, ease: "easeOut" }}
                          className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-gradient-to-r from-secondary to-secondary/70' : 'bg-gradient-to-r from-primary to-primary-light'}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
    </>
  );
};

export default Dashboard;
