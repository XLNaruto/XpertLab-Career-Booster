import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ApprovalPopup from "@/components/ApprovalPopup";
import { ChevronRight, ChevronLeft, Send, ArrowLeft, CheckCircle2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const Lightbox = React.lazy(() => import("yet-another-react-lightbox"));
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

const allExercises: Record<string, {
  id: string; title: string; subtitle: string; tech: string; techName: string;
  images: string[]; instructions: string[];
}> = {
  "html-1": {
    id: "html-1", title: "Semantic HTML Structure", tech: "html", techName: "HTML5",
    subtitle: "Learn to use semantic HTML5 tags for better accessibility, SEO, and code readability. This exercise covers the proper usage of header, nav, main, article, section, aside, and footer elements.",
    images: [
      "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
    ],
    instructions: [
      "Start by creating a basic HTML5 boilerplate with proper DOCTYPE, html, head, and body elements.",
      "Replace all generic div elements with appropriate semantic tags such as <header>, <nav>, <main>, <article>, <section>, <aside>, and <footer>.",
      "Ensure each page section has a clear hierarchy using heading tags (h1-h6) in a logical order.",
      "Add ARIA landmarks and roles where semantic tags alone aren't sufficient for accessibility.",
      "Validate your HTML using the W3C Markup Validation Service and fix any errors or warnings.",
      "Test your page with a screen reader to verify the semantic structure is properly interpreted.",
    ],
  },
  "html-2": {
    id: "html-2", title: "HTML Forms & Validation", tech: "html", techName: "HTML5",
    subtitle: "Build complex, accessible forms using native HTML5 validation attributes, custom validation patterns, and proper form semantics for an optimal user experience.",
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=400&fit=crop",
    ],
    instructions: [
      "Create a multi-section registration form with fieldsets and legends for logical grouping.",
      "Implement required, pattern, min/max, and custom validity constraints on form fields.",
      "Style validation states using CSS :valid, :invalid, and :focus pseudo-classes.",
      "Add accessible labels, placeholders, and error messages to every input field.",
      "Test form submission and validation across different browsers.",
    ],
  },
  "html-3": {
    id: "html-3", title: "HTML5 Canvas Drawing", tech: "html", techName: "HTML5",
    subtitle: "Create interactive graphics and animations using the HTML5 Canvas API. Learn to draw shapes, apply transformations, and build simple games.",
    images: [
      "https://images.unsplash.com/photo-1550439062-609e1531270e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600&h=400&fit=crop",
    ],
    instructions: [
      "Set up a responsive canvas element with proper sizing and pixel ratio handling.",
      "Draw basic shapes: rectangles, circles, lines, and paths using the Canvas 2D context.",
      "Implement transformations: translate, rotate, and scale for complex compositions.",
      "Create an animation loop using requestAnimationFrame for smooth 60fps animations.",
      "Add mouse/touch interaction to make the canvas drawings interactive.",
      "Build a simple particle system or mini-game as a final project.",
    ],
  },
};

const fallbackExercise = {
  id: "unknown", title: "Exercise", subtitle: "This exercise covers fundamental concepts with hands-on practice and real-world examples.", tech: "html", techName: "General",
  images: [
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  ],
  instructions: [
    "Read through the provided documentation and reference materials.",
    "Set up your development environment with the required tools.",
    "Follow the step-by-step guide to complete each section of the exercise.",
    "Test your implementation thoroughly and fix any issues.",
    "Submit your completed work for review and approval.",
  ],
};

const ExerciseDetail = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showApproval, setShowApproval] = useState(false);

  const exercise = allExercises[exerciseId || ""] || {
    ...fallbackExercise,
    id: exerciseId,
    title: exerciseId?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Exercise",
  };

  const handlePrevImage = () => setActiveImage((prev) => (prev === 0 ? exercise.images.length - 1 : prev - 1));
  const handleNextImage = () => setActiveImage((prev) => (prev === exercise.images.length - 1 ? 0 : prev + 1));

  return (
    <>
      <ApprovalPopup open={showApproval} onClose={() => setShowApproval(false)} exerciseTitle={exercise.title} />

      {/* Lightbox */}
      {lightboxOpen && (
        <React.Suspense fallback={null}>
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={activeImage}
            slides={exercise.images.map((src) => ({ src }))}
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
          <Link to="/exercises/technology" className="hover:text-foreground transition-colors">Exercises</Link>
          <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-foreground font-medium"
          >
            {exercise.title}
          </motion.span>
        </motion.div>

        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <motion.div whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link to="/exercises/technology" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-7 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Exercises
            </Link>
          </motion.div>
        </motion.div>

        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 max-w-3xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-[30px] font-bold text-foreground mb-2"
          >
            {exercise.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-[15px] text-muted-foreground leading-relaxed"
          >
            {exercise.subtitle}
          </motion.p>
        </motion.div>

        {/* Images (left) + Instructions & Action (right) on XL */}
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 mb-8">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl overflow-hidden backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
              {/* Main Image */}
              <div
                className="relative aspect-[16/10] overflow-hidden cursor-pointer group"
                onClick={() => setLightboxOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    src={exercise.images[activeImage]}
                    alt={`${exercise.title} - Image ${activeImage + 1}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {exercise.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImage ? "bg-white w-6" : "bg-white/50 w-1.5 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnails (horizontal, small squares) */}
              <div className="p-3 flex items-center gap-2">
                {exercise.images.map((img, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveImage(i)}
                    className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      i === activeImage
                        ? "border-primary shadow-[0_0_0_2px_hsl(342,80%,53%,0.2)] scale-105"
                        : "border-transparent opacity-50 hover:opacity-90"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right side: Instructions + Ready to start */}
          <div className="space-y-5">
            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-7 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <motion.h2
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="text-lg font-bold text-foreground mb-6"
              >
                Instructions
              </motion.h2>
              <div className="space-y-5">
                {exercise.instructions.map((instruction, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -25, y: 5 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                      delay: 0.5 + i * 0.08,
                    }}
                    whileHover={{ x: 6 }}
                    className="flex gap-4 group cursor-default"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.55 + i * 0.08 }}
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </motion.div>
                    <p className="text-[13.5px] text-muted-foreground leading-relaxed pt-1.5 group-hover:text-foreground transition-colors duration-200">{instruction}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Send Request Action */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-5 backdrop-blur-[20px] shadow-[var(--shadow-sm)]">
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.65 }}
                  className="text-base font-bold text-foreground mb-2"
                >
                  Ready to start?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="text-[13px] text-muted-foreground mb-5 leading-relaxed"
                >
                  Send a request to your tutor for approval. Once approved, you can begin working on this exercise.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.75 }}
                  whileHover={!requestSent ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!requestSent ? { scale: 0.98 } : {}}
                  onClick={() => setRequestSent(true)}
                  disabled={requestSent}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    requestSent
                      ? "bg-green-500 text-white shadow-[0_8px_28px_hsl(142_70%_45%/0.3)]"
                      : "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.42)]"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {requestSent ? (
                      <motion.span
                        key="sent"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Request Sent
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Send Request for Approval
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                  {requestSent && (
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
        </div>
      </div>
    </>
  );
};

export default ExerciseDetail;
