import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import WelcomePopup from "@/components/WelcomePopup";
import { CalendarDays, CheckCircle2, XCircle, TrendingUp, Clock, Star, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, momentLocalizer, type ToolbarProps } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { getEncodedCookie, toasterrormsg } from "@/utils/reusable";

// Stat card shape for the attendance summary
type StatCard = {
  label: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
};

// Shape of the dashboard analysis API response
type DashboardAnalysis = {
  trainingProgress: {
    totalDays: number;
    completedDays: number;
    remainingDays: number;
    percentage: number;
  };
  feePayment: {
    totalFee: number;
    paidFee: number;
    pendingFee: number;
    percentPaid: number;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    extraDays: number;
  };
  training: {
    overall: {
      completedExercises: number;
      totalExercises: number;
      percentage: number;
    };
    courses: {
      technologyId: string;
      name: string;
      completed: number;
      total: number;
      percentage: number;
    }[];
  };
};

const emptyAnalysis: DashboardAnalysis = {
  trainingProgress: { totalDays: 0, completedDays: 0, remainingDays: 0, percentage: 0 },
  feePayment: { totalFee: 0, paidFee: 0, pendingFee: 0, percentPaid: 0 },
  attendance: { totalDays: 0, presentDays: 0, absentDays: 0, extraDays: 0 },
  training: { overall: { completedExercises: 0, totalExercises: 0, percentage: 0 }, courses: [] },
};

// Status of a single day in the attendance calendar
type DayStatus = "present" | "absent" | "upcoming" | "weekend" | "holiday";

type CalendarDay = {
  date: string;
  day: number;
  weekday: number;
  isToday: boolean;
  status: DayStatus;
};

// Shape of the dashboard calendar API response
type DashboardCalendar = {
  month: number;
  year: number;
  today: string;
  courseStartDate: string;
  courseEndDate: string;
  days: CalendarDay[];
  holidays: { holidayId: string; name: string; from: string; to: string }[];
};

// react-big-calendar localizer
const localizer = momentLocalizer(moment);

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
const CountUpCard = ({ stat, index }: { stat: StatCard; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const target = stat.value;
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
const AttendanceCalendar = ({
  calendar,
  onMonthChange,
}: {
  calendar: DashboardCalendar | null;
  onMonthChange: (month: number, year: number) => void;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleNavigate = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      onMonthChange(moment(date).month() + 1, moment(date).year());
    },
    [onMonthChange],
  );

  // Map each date string to its status (attendance days + holidays)
  const statusByDate = useMemo(() => {
    const map: Record<string, DayStatus> = {};
    (calendar?.days || []).forEach((d) => {
      map[d.date] = d.status;
    });
    (calendar?.holidays || []).forEach((h) => {
      if (!h?.from) return;
      const start = moment(h.from).startOf("day");
      const end = moment(h.to || h.from).startOf("day");
      for (let d = start.clone(); d.isSameOrBefore(end, "day"); d.add(1, "day")) {
        map[d.format("YYYY-MM-DD")] = "holiday";
      }
    });
    return map;
  }, [calendar]);

  const todayStr = calendar?.today || "";
  const courseStartStr = calendar?.courseStartDate || "";
  const courseEndStr = calendar?.courseEndDate || "";

  const components = useMemo(() => ({
    toolbar: (props: ToolbarProps) => <CustomToolbar label={props.label} onNavigate={props.onNavigate} />,
    month: {
      dateHeader: ({ date, label }: { date: Date; label: string }) => {
        const dateStr = moment(date).format("YYYY-MM-DD");
        const cellMonth = moment(date).month();
        const viewMonth = moment(currentDate).month();
        const isOutside = cellMonth !== viewMonth;
        const isToday = dateStr === todayStr;
        const dow = moment(date).day(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dow === 0 || dow === 6;
        // Days before the course starts or after it ends are disabled
        const isOutsideCourse =
          (!!courseStartStr && moment(date).isBefore(moment(courseStartStr), "day")) ||
          (!!courseEndStr && moment(date).isAfter(moment(courseEndStr), "day"));
        // Saturday & Sunday are always off days
        const status: DayStatus | undefined = isWeekend
          ? "weekend"
          : statusByDate[dateStr];

        let bg = "transparent";
        let shadow = "none";
        let color = "hsl(var(--foreground) / 0.6)";
        let opacity = 1;

        if (isOutside) {
          color = "hsl(var(--foreground) / 0.2)";
        } else if (isOutsideCourse) {
          // Disabled — outside the course period
          color = "hsl(var(--foreground) / 0.25)";
          opacity = 0.4;
        } else if (isToday) {
          bg = "linear-gradient(to bottom right, hsl(var(--secondary)), hsl(var(--secondary) / 0.8))";
          shadow = "0 4px 16px hsl(207 65% 50% / 0.3)";
          color = "white";
        } else if (status === "present") {
          bg = "rgb(220 252 231)";
          color = "rgb(21 128 61)";
        } else if (status === "absent") {
          bg = "hsl(342 80% 53% / 0.12)";
          color = "hsl(342 80% 53%)";
        } else if (status === "holiday") {
          bg = "rgb(254 243 199)";
          color = "rgb(180 83 9)";
        } else if (status === "weekend") {
          color = "hsl(var(--foreground) / 0.25)";
        }

        const highlighted =
          isToday || status === "present" || status === "absent" || status === "holiday";

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
              opacity,
              fontWeight: highlighted ? 600 : 500,
              fontSize: "13px",
            }}
          >
            {label}
          </div>
        );
      },
    },
  }), [currentDate, statusByDate, todayStr, courseStartStr, courseEndStr]);

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
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-[11px] text-muted-foreground">Holiday</span>
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
  const [firstName, setFirstName] = useState("");
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  const { displayed, done } = useTypewriter(greeting, 55, 400);
  const attendanceRef = useRef<HTMLDivElement>(null);
  const [attendanceHeight, setAttendanceHeight] = useState<number | undefined>(undefined);
  const [analysis, setAnalysis] = useState<DashboardAnalysis>(emptyAnalysis);
  const [calendar, setCalendar] = useState<DashboardCalendar | null>(null);

  const fetchPersonalDetails = async () => {
    const traineeId = getEncodedCookie("traineeId");
    if (!traineeId) return;
    const response: any = await postData(
      "private/trainee/personaldetail/get",
      { traineeId },
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      setFirstName(data.firstName || "");
    }
  };

  useEffect(() => {
    fetchPersonalDetails();
  }, []);

  const dashboardAnalysisApiCall = async () => {
    const response: any = await postData(
      "private/trainee/dashboard/analysis",
      {},
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      setAnalysis({
        ...emptyAnalysis,
        ...data,
        trainingProgress: { ...emptyAnalysis.trainingProgress, ...data.trainingProgress },
        feePayment: { ...emptyAnalysis.feePayment, ...data.feePayment },
        attendance: { ...emptyAnalysis.attendance, ...data.attendance },
        training: {
          overall: { ...emptyAnalysis.training.overall, ...data.training?.overall },
          courses: data.training?.courses || [],
        },
      });
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
  };

  const dashboardCalendarApiCall = async (month: number, year: number) => {
    const response: any = await postData(
      "private/trainee/dashboard/calendar",
      { month, year },
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      setCalendar(response.data.data || null);
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    dashboardAnalysisApiCall();
    dashboardCalendarApiCall(moment().month() + 1, moment().year());
  }, []);

  const { trainingProgress, feePayment, attendance, training } = analysis;
  const courses = training.courses;
  const overall = training.overall;

  const attendanceStats: StatCard[] = [
    { label: "Total Days", value: attendance.totalDays, icon: <CalendarDays className="w-5 h-5" />, iconBg: "bg-secondary/10 text-secondary" },
    { label: "Present Days", value: attendance.presentDays, icon: <CheckCircle2 className="w-5 h-5" />, iconBg: "bg-green-500/10 text-green-500" },
    { label: "Absent Days", value: attendance.absentDays, icon: <XCircle className="w-5 h-5" />, iconBg: "bg-primary/10 text-primary" },
    { label: "Extra Days", value: attendance.extraDays, icon: <Star className="w-5 h-5" />, iconBg: "bg-amber-500/10 text-amber-500" },
  ];

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString("en-IN")}`;

  // Holidays for the viewed month(s), from the calendar API, sorted by date
  type HolidayItem = { name: string; date: string; from: moment.Moment; to: moment.Moment };
  const upcomingHolidays: HolidayItem[] = (calendar?.holidays || [])
    .map((h) => {
      const from = moment(h.from).startOf("day");
      const to = moment(h.to || h.from).startOf("day");
      const sameDay = from.isSame(to, "day");
      return {
        name: h.name || "Holiday",
        date: sameDay
          ? from.format("DD/MM/YYYY")
          : `${from.format("DD/MM/YYYY")} to ${to.format("DD/MM/YYYY")}`,
        from,
        to,
      };
    })
    .sort((a, b) => a.from.valueOf() - b.from.valueOf());

  // Group upcoming holidays by month for display
  const holidayGroups = upcomingHolidays.reduce<
    { label: string; items: HolidayItem[] }[]
  >((groups, h) => {
    const label = h.from.format("MMMM YYYY");
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(h);
    else groups.push({ label, items: [h] });
    return groups;
  }, []);

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
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">You have completed <span className="font-semibold text-secondary">{trainingProgress.completedDays} out of {trainingProgress.totalDays} days</span> of the training program. Only <span className="font-semibold text-secondary">{trainingProgress.remainingDays} days remaining</span> to complete the training.</p>
                <div className="mt-3 w-full h-2 rounded-full bg-secondary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trainingProgress.percentage}%` }}
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
                  {trainingProgress.percentage}% completed
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
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">Total fee: <span className="font-semibold text-foreground">{formatCurrency(feePayment.totalFee)}</span>. Paid: <span className="font-semibold text-secondary">{formatCurrency(feePayment.paidFee)}</span>. Remaining: <span className="font-semibold text-primary">{formatCurrency(feePayment.pendingFee)}</span> — please pay as soon as possible to continue your training.</p>
                <div className="mt-3 w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${feePayment.percentPaid}%` }}
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
                  {feePayment.percentPaid}% paid
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
                        Holidays
                      </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1">
                      {holidayGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No upcoming holidays
                        </p>
                      ) : (
                        holidayGroups.map((group) => (
                          <div key={group.label} className="mb-3 last:mb-0">
                            <div className="divide-y divide-border">
                              {group.items.map((h, i) => (
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
                        ))
                      )}
                    </div>
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
              <AttendanceCalendar calendar={calendar} onMonthChange={dashboardCalendarApiCall} />
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
                      <div className="text-[11px] text-muted-foreground">{overall.completedExercises} of {overall.totalExercises} exercises completed</div>
                    </div>
                  </div>
                  <div className="text-[22px] font-bold font-serif text-secondary">{overall.percentage}%</div>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overall.percentage}%` }}
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
                  const pct = c.percentage;
                  return (
                    <motion.div
                      key={c.technologyId || c.name}
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
                            <div className="text-[11px] text-muted-foreground">{c.completed}/{c.total} exercises</div>
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
