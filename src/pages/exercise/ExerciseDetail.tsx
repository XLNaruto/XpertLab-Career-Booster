import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { decryptUrlData, encryptUrlData, toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import ApprovalPopup from "@/components/ApprovalPopup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Send, ArrowLeft, CheckCircle2, Award, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const Lightbox = React.lazy(() => import("yet-another-react-lightbox"));
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

// Shape of the exercise detail API response
type ExerciseDetailData = {
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
  exercise: {
    trainingexerciseId: string;
    technologyId: string;
    name: string;
    image: string;
    instruction: string;
    exerciseSpecificImages: string | string[];
    order: number;
    requestStatus: string;
  } | null;
};

const ExerciseDetail = () => {
  const [searchParams] = useSearchParams();
  const { trainingexerciseId = "", technologyId = "", name = "" } = decryptUrlData(searchParams.get("data"));
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState("NOT_SENT");
  const [requesting, setRequesting] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [data, setData] = useState<ExerciseDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const exerciseDetailApiCall = async () => {
    setLoading(true);
    const response: any = await postData(
      "private/trainee/exercise/detail",
      { trainingexerciseId },
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d: ExerciseDetailData = response.data.data || {};
      setData(d);
      setRequestStatus(d.exercise?.requestStatus || "NOT_SENT");
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  const sendRequestApiCall = async () => {
    setRequesting(true);
    const response: any = await postData(
      "private/trainee/exercise/request",
      { trainingexerciseId },
      apiHeader(false, 2)
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      setRequestStatus("PENDING");
      toastsuccessmsg(response?.data?.message || "Request sent for approval");
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
    setRequesting(false);
  };

  useEffect(() => {
    if (trainingexerciseId) exerciseDetailApiCall();
  }, [trainingexerciseId]);

  const ex = data?.exercise;
  const title = ex?.name || name || "Exercise";
  const techName = data?.technology?.name || "";

  // Back link to the exercise list for this technology, matching ExerciseList's data shape
  const backToListUrl = `/exercises/list?data=${encryptUrlData({
    technologyId,
    name: techName || name,
  })}`;
  const instruction = ex?.instruction || "";
  const images = [ex?.image]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  const isPending = requestStatus === "PENDING";
  const isApproved = requestStatus === "APPROVED";
  const isNotSent = !isPending && !isApproved;

  const statusCopy = isApproved
    ? { title: "You're approved!", desc: "Your tutor approved this exercise. You can begin working on it now." }
    : isPending
    ? { title: "Awaiting approval", desc: "Your request has been sent. Your tutor will review it shortly." }
    : { title: "Ready to start?", desc: "Send a request to your tutor for approval. Once approved, you can begin working on this exercise." };

  const openLightbox = (idx: number) => {
    setActiveImage(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <ApprovalPopup open={showApproval} onClose={() => setShowApproval(false)} exerciseTitle={title} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send request for approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Your tutor will be notified to review this exercise. You can't undo this once it's sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendRequestApiCall()}
              className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground hover:opacity-90"
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxOpen && (
        <React.Suspense fallback={null}>
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={activeImage}
            slides={images.map((src) => ({ src }))}
            plugins={[Zoom]}
            on={{ view: ({ index }: { index: number }) => setActiveImage(index) }}
          />
        </React.Suspense>
      )}

      <div className="flex-1 px-10 pb-10">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
        >
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.span>
          <Link to={backToListUrl} className="hover:text-foreground transition-colors">{techName ? `${techName} Exercises` : "Exercises"}</Link>
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-foreground font-medium"
          >
            {title}
          </motion.span>
        </motion.div>

        {/* Title & Subtitle + Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-[30px] font-bold text-foreground mb-2"
            >
              {title}
            </motion.h1>
            {(techName || data?.course?.courseName) && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="text-[15px] text-muted-foreground leading-relaxed"
              >
                {[techName, data?.course?.courseName].filter(Boolean).join(" · ")}
              </motion.p>
            )}
          </div>
          <Link
            to={backToListUrl}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-foreground/[0.15] hover:border-foreground/[0.3] hover:text-foreground hover:bg-white/[0.5] transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Exercises
          </Link>
        </motion.div>

        {loading ? (
          // Skeleton while the exercise detail loads
          <div className="grid grid-cols-1 lg:grid-cols-[6fr_4fr] xl:grid-cols-[7fr_3fr] gap-6 mb-8">
            <div className="space-y-5">
              <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)] animate-pulse">
                <div className="h-5 w-32 rounded bg-foreground/10 mb-6" />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-foreground/[0.07]" />
                  <div className="h-3 w-11/12 rounded bg-foreground/[0.07]" />
                  <div className="h-3 w-3/4 rounded bg-foreground/[0.07]" />
                  <div className="h-3 w-5/6 rounded bg-foreground/[0.07]" />
                </div>
              </div>
              <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)] animate-pulse">
                <div className="h-4 w-28 rounded bg-foreground/10 mb-3" />
                <div className="h-3 w-full rounded bg-foreground/[0.07] mb-5" />
                <div className="h-12 w-full rounded-xl bg-foreground/10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 self-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-foreground/[0.07] animate-pulse" style={{ aspectRatio: "1 / 1" }} />
              ))}
            </div>
          </div>
        ) : (
        /* Instructions (70%) + Media gallery (30%) */
        <div className="grid grid-cols-1 lg:grid-cols-[6fr_4fr] xl:grid-cols-[7fr_3fr] gap-6 mb-8">
          {/* Left 70%: Instructions + Ready to start */}
          <div className="space-y-5">
            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <motion.h2
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-lg font-bold text-foreground mb-6"
              >
                Instructions
              </motion.h2>
              {instruction ? (
                <div
                  className="text-[13.5px] text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: instruction }}
                />
              ) : (
                <p className="text-[13.5px] text-muted-foreground">No instructions provided for this exercise.</p>
              )}
            </motion.div>

            {/* Send Request Action */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="text-base font-bold text-foreground mb-2"
                >
                  {statusCopy.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.65 }}
                  className="text-[13px] text-muted-foreground mb-5 leading-relaxed"
                >
                  {statusCopy.desc}
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  whileHover={isNotSent && !requesting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={isNotSent && !requesting ? { scale: 0.98 } : {}}
                  onClick={() => isNotSent && !requesting && setConfirmOpen(true)}
                  disabled={!isNotSent || requesting}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isApproved
                      ? "bg-green-500 text-white shadow-[0_8px_28px_hsl(142_70%_45%/0.3)] cursor-default"
                      : isPending
                      ? "bg-amber-400/90 text-amber-950 shadow-[0_8px_28px_hsl(38_92%_50%/0.3)] cursor-default"
                      : "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)] disabled:opacity-70"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isApproved ? (
                      <motion.span key="approved" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </motion.span>
                    ) : isPending ? (
                      <motion.span key="pending" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Approval Pending
                      </motion.span>
                    ) : requesting ? (
                      <motion.span key="sending" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                      </motion.span>
                    ) : (
                      <motion.span key="send" exit={{ opacity: 0, scale: 0.5 }} className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> Send Request for Approval
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {isApproved && (
                    <motion.button
                      initial={{ opacity: 0, y: 15, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowApproval(true)}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-foreground/[0.04] border border-foreground/[0.08] text-foreground hover:bg-foreground/[0.07] transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4 text-green-600" /> View Approval
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right 30%: Media gallery (2x2 square grid) */}
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-2.5 self-start"
            >
              {images.slice(0, 4).map((src, i) => {
                const isLast = i === 3 && images.length > 4;
                const isSingle = images.length === 1;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    onClick={() => openLightbox(i)}
                    className={`relative overflow-hidden rounded-xl cursor-pointer bg-white/[0.4] border border-white/[0.7] ${isSingle ? "col-span-2" : ""}`}
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={src}
                      alt={`${title} - Image ${i + 1}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {isLast && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl"
                        style={{
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        +{images.length - 4}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
        )}
      </div>
    </>
  );
};

export default ExerciseDetail;
