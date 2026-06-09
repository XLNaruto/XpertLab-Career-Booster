import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight, ArrowRight, ArrowLeft, Code2, PackageOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { decryptUrlData, encryptUrlData, toasterrormsg } from "@/utils/reusable";

// Shape of a single exercise returned by the exercise list API
type ApiExercise = {
  trainingexerciseId: string;
  technologyId: string;
  name: string;
  image: string;
  instruction: string;
  exerciseSpecificImages: string;
  order: number;
  requestStatus: string;
};

// Shape of the exercise list API response
type ExerciseListData = {
  course: {
    traineecourseId: string;
    coursedurationId: string;
    courseId: string;
    courseName: string;
  } | null;
  technology: {
    technologyId: string;
    name: string;
    learningOrder: number;
  } | null;
  exerciseCount: number;
  completedCount: number;
  exercises: ApiExercise[];
};

const emptyData: ExerciseListData = {
  course: null,
  technology: null,
  exerciseCount: 0,
  completedCount: 0,
  exercises: [],
};

const ExerciseList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { technologyId = "", name = "" } = decryptUrlData(searchParams.get("data"));

  const [data, setData] = useState<ExerciseListData>(emptyData);
  const [loading, setLoading] = useState(true);

  const exerciseListApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exercise/list",
      { technologyId},
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d = response.data.data || {};
      setData({
        ...emptyData,
        ...d,
        exercises: (d.exercises || []).slice().sort(
          (a: ApiExercise, b: ApiExercise) => (a.order || 0) - (b.order || 0)
        ),
      });
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (technologyId) exerciseListApiCall();
  }, [technologyId]);

  const techName = data.technology?.name || name;
  const exercises = data.exercises;

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
        <span className="text-foreground font-medium">{techName}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white shadow-lg">
              <Code2 className="w-5 h-5" />
            </span>
            {techName} Exercises
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data.completedCount} of {data.exerciseCount} completed
            {data.course?.courseName ? ` · ${data.course.courseName}` : ""}
          </p>
        </div>
        <button onClick={() => navigate("/exercises/technology")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-foreground/[0.15] hover:border-foreground/[0.3] hover:text-foreground hover:bg-white/[0.5] transition-all duration-200">
          ← All Technologies
        </button>
      </motion.div>

      {loading ? (
        // Skeleton loading grid
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/[0.4] border border-white/[0.7] rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-foreground/[0.07]" />
              <div className="p-5">
                <div className="h-4 w-2/3 rounded bg-foreground/10 mb-3" />
                <div className="h-3 w-full rounded bg-foreground/[0.07] mb-2" />
                <div className="h-3 w-1/2 rounded bg-foreground/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      ) : exercises.length === 0 ? (
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
            No exercises yet
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm max-w-xs"
          >
            There are no exercises available for{" "}
            <span className="font-semibold text-foreground">{techName || "this technology"}</span> yet. Check back soon!
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/exercises/technology")}
            className="group mt-7 inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold text-foreground/80 bg-white/[0.6] border border-white/[0.88] backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:bg-white/[0.9] hover:text-foreground hover:shadow-[var(--shadow-md)] transition-all duration-300"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary group-hover:-translate-x-0.5 transition-transform duration-300">
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
            Browse other technologies
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {exercises.map((exercise, index) => {
            return (
              <motion.div
                key={exercise.trainingexerciseId}
                variants={{
                  hidden: { opacity: 0, y: 25, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
                }}
              >
                <Link
                  to={`/exercises/details?data=${encryptUrlData({
                    trainingexerciseId: exercise.trainingexerciseId,
                    technologyId: exercise.technologyId,
                    name: exercise.name,
                  })}`}
                  className="group flex flex-col h-full bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:bg-white/[0.85] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    {/* Number indicator */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {/* Arrow */}
                    <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </div>

                  <h3 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">{exercise.name}</h3>
                  <div
                    className="text-[13px] text-muted-foreground leading-relaxed line-clamp-1 [&_*]:!m-0"
                    dangerouslySetInnerHTML={{ __html: exercise.instruction }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default ExerciseList;
