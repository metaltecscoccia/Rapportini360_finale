import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import DemoSection from "./components/DemoSection";
import FeaturesSection from "./components/FeaturesSection";
import PricingSection from "./components/PricingSection";
import FAQSection from "./components/FAQSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <DemoSection />
          <FeaturesSection />
          <PricingSection />
          <FAQSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
