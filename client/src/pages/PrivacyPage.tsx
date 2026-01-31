import Navbar from "@/landing/components/Navbar";
import Footer from "@/landing/components/Footer";
import PrivacyPolicy from "@/landing/components/markdown/PrivacyPolicy";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <PrivacyPolicy />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
