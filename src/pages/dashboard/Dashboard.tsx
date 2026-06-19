import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import WelcomePopup from "@/components/WelcomePopup";
import { CalendarDays, CheckCircle2, XCircle, TrendingUp, Clock, Star, PartyPopper, ChevronLeft, ChevronRight, GraduationCap, Circle, Laptop, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, momentLocalizer, type ToolbarProps } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
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
  course: {
    traineecourseId: string;
    coursedurationId: string;
    courseName: string;
    startDate: string;
    endDate: string;
    enrollmentType: string;
  } | null;
};

const emptyAnalysis: DashboardAnalysis = {
  trainingProgress: { totalDays: 0, completedDays: 0, remainingDays: 0, percentage: 0 },
  feePayment: { totalFee: 0, paidFee: 0, pendingFee: 0, percentPaid: 0 },
  attendance: { totalDays: 0, presentDays: 0, absentDays: 0, extraDays: 0 },
  training: { overall: { completedExercises: 0, totalExercises: 0, percentage: 0 }, courses: [] },
  course: null,
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

// Shape of a single advertised course (from coursedetail/advertise)
type AdvertiseCourse = {
  coursedurationId: string;
  courseId: string;
  duration: number;
  courseFees: number;
  certificateFees: number;
  description: string;
  laptopRequired: number;
  courseName: string;
  isCoursePurchased: boolean;
  technologies?: { technologyId: number; name: string; learningOrder: number }[];
};

// react-big-calendar localizer
const localizer = momentLocalizer(moment);

// Break a day count into a readable "X month Y week Z day" string
// (1 month = 4 weeks = 28 days, 1 week = 7 days).
const formatDuration = (totalDays: number): string => {
  const days = Math.max(0, Math.round(totalDays || 0));
  if (days === 0) return "0 day";
  const months = Math.floor(days / 28);
  const weeks = Math.floor((days % 28) / 7);
  const remDays = days % 7;
  const parts: string[] = [];
  if (months) parts.push(`${months} month`);
  if (weeks) parts.push(`${weeks} week`);
  if (remDays) parts.push(`${remDays} day`);
  return parts.join(" ");
};

// Compact Indian-rupee formatting so big fees fit the small ribbon.
// < 1 lakh -> full (₹15,000); >= 1 lakh -> ₹2.5L; >= 1 crore -> ₹1.2Cr.
const formatFeeCompact = (amount: number): string => {
  const n = Number(amount || 0);
  if (n >= 1_00_00_000) {
    const v = n / 1_00_00_000;
    return `₹${Number.isInteger(v) ? v : v.toFixed(1)}Cr`;
  }
  if (n >= 1_00_000) {
    const v = n / 1_00_000;
    return `₹${Number.isInteger(v) ? v : v.toFixed(1)}L`;
  }
  return `₹${n.toLocaleString("en-IN")}`;
};

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
  const [advertiseCourses, setAdvertiseCourses] = useState<AdvertiseCourse[]>([]);

  // Raw data used to compute the profile-completion checklist
  const [personalData, setPersonalData] = useState<any>(null);
  const [guardianList, setGuardianList] = useState<any[]>([]);
  const [educationList, setEducationList] = useState<any[]>([]);
  const [documentsComplete, setDocumentsComplete] = useState(false);

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
      setPersonalData(data);
    }
  };

  // Fetch the remaining profile sections (in parallel) for the completion checklist
  const profileCompletionApiCall = async () => {
    const traineeId = getEncodedCookie("traineeId");
    if (!traineeId) return;
    const [guardianRes, educationRes, documentRes, masterDocRes]: any[] =
      await Promise.all([
        postData("private/trainee/guardiandetail/list", { traineeId }, apiHeader(false, 2)),
        postData("private/trainee/educationdetail/list", { traineeId }, apiHeader(false, 2)),
        postData("private/trainee/documentdetail/list", { traineeId }, apiHeader(false, 2)),
        postData("master/traineedocument/list", {}, apiHeader(false, 2)),
      ]);

    const ok = (r: any) =>
      String(r?.status) === "200" && String(r?.data?.status) === "200";

    if (ok(guardianRes)) {
      const d = guardianRes.data.data;
      setGuardianList(Array.isArray(d) ? d : d?.list || []);
    }
    if (ok(educationRes)) {
      const d = educationRes.data.data;
      setEducationList(Array.isArray(d) ? d : d?.list || []);
    }

    // Documents complete = aadhar present AND every compulsory document uploaded
    if (ok(documentRes) && ok(masterDocRes)) {
      const docData = documentRes.data.data || {};
      const uploaded: any[] = Array.isArray(docData)
        ? docData
        : docData.list || docData.documents || [];
      const aadhar = docData.aadharcardNumber || docData.aadharNumber || "";
      const master: any[] = masterDocRes.data.data?.list || [];
      const compulsory = master.filter(
        (m) =>
          m.isCompulsory === true ||
          m.isCompulsory === 1 ||
          String(m.isCompulsory) === "1"
      );
      const allCompulsoryUploaded = compulsory.every((m) =>
        uploaded.some(
          (u) =>
            String(u.traineedocumentId) === String(m.traineedocumentId) &&
            !!u.document
        )
      );
      setDocumentsComplete(!!aadhar && allCompulsoryUploaded);
    }
  };

  useEffect(() => {
    fetchPersonalDetails();
    profileCompletionApiCall();
  }, []);

  const dashboardAnalysisApiCall = async () => {
    const response: any = await postData(
      "private/trainee/dashboard/analysis",
      {},
      apiHeader(false, 0)
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

  const advertiseApiCall = async () => {
    const response: any = await postData(
      "private/trainee/coursedetail/advertise",
      {},
      apiHeader(false, 0)
    );
    const payload = response?.data;
    const list: AdvertiseCourse[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    // The API can return the same duration more than once — keep one per
    // coursedurationId.
    const seen = new Set<string>();
    const unique = list.filter((c) => {
      const key = String(c.coursedurationId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setAdvertiseCourses(unique);
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
    advertiseApiCall();
  }, []);

  const { trainingProgress, attendance, training, course } = analysis;
  const courses = training.courses;
  const overall = training.overall;

  // Profile-completion checklist: each section + whether it's filled in.
  // "Complete" rules mirror the required fields in myprofile/components/schemas.ts.
  const filled = (v: any) => v !== undefined && v !== null && String(v).trim() !== "";
  const profileSections = [
    {
      label: "Personal Details",
      tab: "Personal Details",
      complete:
        !!personalData &&
        [
          personalData.firstName,
          personalData.lastName,
          personalData.gender,
          personalData.birthDate,
          personalData.email,
          personalData.mobileNumber,
          personalData.username,
        ].every(filled),
    },
    {
      label: "Location Details",
      tab: "Location Details",
      complete:
        !!personalData &&
        [personalData.stateId, personalData.cityId, personalData.address].every(filled),
    },
    { label: "Guardian Details", tab: "Guardian Details", complete: guardianList.length > 0 },
    { label: "Education Details", tab: "Education Details", complete: educationList.length > 0 },
    { label: "Course Details", tab: "Course Details", complete: !!course },
    { label: "Documents", tab: "Documents", complete: documentsComplete },
  ];
  const completedSections = profileSections.filter((s) => s.complete).length;
  const profilePercent = Math.round((completedSections / profileSections.length) * 100);

  // Attendance breakdown donut (same data as the stat cards, shown as a chart)
  const attendanceChartData = [
    { name: "Present", value: attendance.presentDays, color: "#22c55e" },
    { name: "Absent", value: attendance.absentDays, color: "hsl(342 80% 53%)" },
    { name: "Extra", value: attendance.extraDays, color: "#f59e0b" },
  ].filter((d) => d.value > 0);
  const attendanceRate = attendance.totalDays
    ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
    : 0;

  // Per-technology completion as a bar chart (same data as the technologies list)
  const techChartData = courses.map((c) => ({
    name: c.name,
    percentage: c.percentage,
    completed: c.completed,
    total: c.total,
    pending: Math.max(0, c.total - c.completed),
  }));

  // Courses to advertise — show the ones the trainee hasn't purchased yet
  // first, so the upsell stands out.
  const sortedCourses = [...advertiseCourses].sort(
    (a, b) => Number(a.isCoursePurchased) - Number(b.isCoursePurchased),
  );

  const attendanceStats: StatCard[] = [
    { label: "Total Days", value: attendance.totalDays, icon: <CalendarDays className="w-5 h-5" />, iconBg: "bg-secondary/10 text-secondary" },
    { label: "Present Days", value: attendance.presentDays, icon: <CheckCircle2 className="w-5 h-5" />, iconBg: "bg-green-500/10 text-green-500" },
    { label: "Absent Days", value: attendance.absentDays, icon: <XCircle className="w-5 h-5" />, iconBg: "bg-primary/10 text-primary" },
    { label: "Extra Days", value: attendance.extraDays, icon: <Star className="w-5 h-5" />, iconBg: "bg-amber-500/10 text-amber-500" },
  ];

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

            {/* Enrolled Course */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-[20px] flex items-start gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.9 }}
                className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5"
              >
                <GraduationCap className="w-5 h-5 text-indigo-500" />
              </motion.div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-semibold text-foreground mb-1">Enrolled Course</h3>
                {course ? (
                  <>
                    <p className="text-[14px] font-bold text-foreground truncate">{course.courseName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 uppercase tracking-wide">
                        {course.enrollmentType}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {moment(course.startDate).format("DD MMM YYYY")} &rarr; {moment(course.endDate).format("DD MMM YYYY")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Duration: <span className="font-semibold text-foreground">{Math.max(0, moment(course.endDate).diff(moment(course.startDate), "weeks"))} weeks</span>
                    </p>
                  </>
                ) : (
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">No active enrollment found.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6 bg-white/[0.6] border border-white/[0.88] rounded-2xl p-6 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex flex-col lg:flex-row lg:items-center gap-6"
          >
            {/* Circular progress ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-[92px] h-[92px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary) / 0.12)" strokeWidth="9" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - profilePercent / 100) }}
                    transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[22px] font-bold font-serif text-foreground leading-none">{profilePercent}%</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">Profile Completion</h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  {completedSections} of {profileSections.length} sections completed
                </p>
                {completedSections < profileSections.length && (
                  <p className="text-[11.5px] text-secondary font-semibold mt-1">Finish your profile to unlock everything →</p>
                )}
              </div>
            </div>

            {/* Section chips */}
            <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {profileSections.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.06 }}
                >
                  <Link
                    to={`/profile?tab=${encodeURIComponent(s.tab)}`}
                    className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                      s.complete
                        ? "bg-green-500/[0.07] border-green-500/25 hover:bg-green-500/[0.12]"
                        : "bg-white/[0.5] border-foreground/[0.08] hover:border-secondary/40 hover:bg-white/[0.8]"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        s.complete ? "bg-green-500/15" : "bg-foreground/[0.05] group-hover:bg-secondary/10"
                      }`}
                    >
                      {s.complete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-secondary" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-foreground truncate">{s.label}</span>
                      <span className={`block text-[10.5px] font-medium ${s.complete ? "text-green-600" : "text-muted-foreground"}`}>
                        {s.complete ? "Completed" : "Pending"}
                      </span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

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
                Technologies You're Learning ({courses.length})
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

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-5 mt-5">
            {/* Attendance Breakdown (donut) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">Attendance Breakdown</h2>
              <p className="text-[12px] text-muted-foreground mb-4">How your {attendance.totalDays} days split up</p>
              {attendanceChartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  No attendance data yet
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative w-[200px] h-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={90}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {attendanceChartData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--background) / 0.95)",
                            backdropFilter: "blur(8px)",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[26px] font-bold font-serif text-foreground leading-none">{attendanceRate}%</span>
                      <span className="text-[11px] text-muted-foreground mt-1">Present</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    {attendanceChartData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                          <span className="text-[13px] font-medium text-foreground">{d.name}</span>
                        </div>
                        <span className="text-[13px] font-bold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Technology Progress (bar) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">Technology Progress</h2>
              <p className="text-[12px] text-muted-foreground mb-4">Completion across your technologies</p>
              {techChartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  No technologies yet
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-[200px] h-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        data={techChartData}
                        innerRadius="32%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        barSize={13}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background dataKey="percentage" cornerRadius={8}>
                          {techChartData.map((d) => (
                            <Cell
                              key={d.name}
                              fill={d.percentage === 100 ? "#22c55e" : d.percentage >= 50 ? "hsl(207 65% 50%)" : "hsl(342 80% 53%)"}
                            />
                          ))}
                        </RadialBar>
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm px-3 py-2 text-xs shadow-md">
                                <div className="font-semibold text-foreground">{d.name}</div>
                                <div className="text-muted-foreground">{d.percentage}% completed</div>
                                <div className={d.pending > 0 ? "text-primary font-semibold" : "text-green-600 font-semibold"}>
                                  {d.pending > 0 ? `${d.pending} pending` : "All done"}
                                </div>
                              </div>
                            );
                          }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    {techChartData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: d.percentage === 100 ? "#22c55e" : d.percentage >= 50 ? "hsl(207 65% 50%)" : "hsl(342 80% 53%)" }}
                          />
                          <span className="text-[13px] font-medium text-foreground truncate">{d.name}</span>
                        </div>
                        <span className="text-[13px] font-bold text-foreground shrink-0">{d.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Explore More Courses */}
          {sortedCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-5 bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Explore More Courses
                </h2>
              </div>
              <p className="text-[12px] text-muted-foreground mb-5">
                Level up your skills with our other training programs
              </p>

              <Swiper
                modules={[Autoplay]}
                spaceBetween={16}
                slidesPerView={1}
                loop={sortedCourses.length > 1}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="!py-3 !px-1 !-mx-1"
              >
                {sortedCourses.map((c, i) => (
                  <SwiperSlide key={`${c.coursedurationId}-${i}`} className="h-auto">
                    <div
                      className={`relative overflow-hidden flex flex-col h-full rounded-2xl p-5 border hover:shadow-[var(--shadow-sm)] hover:-translate-y-1 transition-all duration-200 ${
                        c.isCoursePurchased
                          ? "bg-green-500/[0.07] border-green-500/25"
                          : "bg-secondary/[0.06] border-secondary/25"
                      }`}
                    >
                      {/* Corner price ribbon */}
                      <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-10">
                        <div className="absolute top-[20px] right-[-40px] w-[150px] rotate-45 bg-gradient-to-r from-secondary to-secondary/80 text-white text-center text-[12px] font-bold py-1 shadow-[0_2px_8px_rgba(0,0,0,0.18)] whitespace-nowrap">
                          {formatFeeCompact(c.courseFees)}
                        </div>
                      </div>

                      {/* Header: icon + duration + status */}
                      <div className="flex items-center gap-2 mb-3 pr-8 flex-wrap">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                          <Clock className="w-3 h-3" />
                          {formatDuration(c.duration)}
                        </span>
                        {c.isCoursePurchased && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Purchased
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-[14.5px] font-bold text-foreground leading-snug mb-1.5">
                        {c.courseName}
                      </h3>

                      {/* Technologies */}
                      {c.technologies && c.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {[...c.technologies]
                            .sort((a, b) => a.learningOrder - b.learningOrder)
                            .map((t, ti) => {
                              const palette = [
                                "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                "bg-amber-500/10 text-amber-600 border-amber-500/20",
                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                "bg-pink-500/10 text-pink-600 border-pink-500/20",
                                "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
                              ];
                              return (
                                <span
                                  key={t.technologyId}
                                  className={`inline-flex items-center text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${palette[ti % palette.length]}`}
                                >
                                  {t.name}
                                </span>
                              );
                            })}
                        </div>
                      )}

                      {/* Footer: laptop note */}
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        {c.laptopRequired === 1 && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                            <Laptop className="w-3.5 h-3.5" /> Laptop required
                          </span>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          )}
        </div>
    </>
  );
};

export default Dashboard;
