import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import HeroLeft from "@/components/HeroLeft";
import HeroRight from "@/components/HeroRight";
import BottomBar from "@/components/BottomBar";

const Welcome = () => (
  <>
    <AnimatedBackground />
    <div className="relative z-10 min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-1 flex items-center justify-center px-[60px] py-10 pb-20 gap-20">
        <HeroLeft />
        <HeroRight />
      </section>
      <BottomBar />
    </div>
  </>
);

export default Welcome;
