import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/Logo.png";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-[1000] bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
              <img src={logo} alt="SIGIZI Logo" className="w-12 h-12" />
              <span className="font-bold text-[20px]">SIGIZI</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <div className="hidden items-center space-x-8 md:flex">
            <Link to="/" className="text-[#232B36] font-medium text-[14px] hover:text-blue-700 transition">
              Beranda
            </Link>
            <Link to="/maps" className="text-[#232B36] font-medium text-[14px] hover:text-blue-700 transition">
              Peta
            </Link>
            <Link to="/artikel" className="text-[#232B36] font-medium text-[14px] hover:text-blue-700 transition">
              Artikel
            </Link>
            <span className="h-8 w-px bg-slate-300 mx-2" />
            <Link to="/login" className="text-[#232B36] font-medium text-[14px] hover:text-blue-700 transition">
              Masuk
            </Link>
            <Link
              to="/register"
              className="bg-[#1673FF] text-white px-5 py-2 rounded-lg font-medium text-[14px] ml-2 shadow-md hover:bg-blue-700 transition"
            >
              Daftar
            </Link>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            isMobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          }`}
        >
          <div className="space-y-1 border-t border-slate-200 pt-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[#232B36] hover:bg-slate-100"
            >
              Beranda
            </Link>
            <Link
              to="/maps"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[#232B36] hover:bg-slate-100"
            >
              Peta
            </Link>
            <Link
              to="/artikel"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[#232B36] hover:bg-slate-100"
            >
              Artikel
            </Link>

            <div className="my-2 h-px bg-slate-200" />

            <div className="space-y-2">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="block rounded-lg bg-[#1673FF] px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
