import { Link } from "wouter";
import logoPath from "@assets/ChatGPT_Image_20_dic_2025,_17_13_27_(1)_1766249871224.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/home" className="flex items-center gap-2 mb-4">
              <img
                src={logoPath}
                alt="Rapportini360"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-white">Rapportini360</span>
            </Link>
            <p className="text-sm text-slate-400">
              La soluzione completa per la gestione digitale dei rapportini
              aziendali.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Prodotto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById("features");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Funzionalita
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById("pricing");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Prezzi
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById("faq");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Azienda */}
          <div>
            <h3 className="font-semibold text-white mb-4">Azienda</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chi siamo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contatti
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legale</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termini di Servizio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            {currentYear} Rapportini360. Tutti i diritti riservati.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
