import Navbar from "@/landing/components/Navbar";
import Footer from "@/landing/components/Footer";
import TermsOfService from "@/landing/components/markdown/TermsOfService";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <TermsOfService />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
