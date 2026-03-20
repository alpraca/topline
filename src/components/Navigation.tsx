import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[rgba(15,15,16,0.78)] backdrop-blur-md border-b border-white/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <a href="#" className="flex items-center">
          <h1
            className={`text-xl md:text-2xl font-serif uppercase tracking-[0.14em] transition-colors ${
              isScrolled ? 'text-white' : 'text-white/95'
            }`}
          >
            Studio Intérieur
          </h1>
        </a>

        <button
          className="md:hidden rounded-full p-2 border border-white/40 bg-black/30 backdrop-blur-sm shadow-[0_10px_20px_-12px_rgba(0,0,0,0.9)]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="text-white" size={20} />
          ) : (
            <Menu className="text-white" size={20} />
          )}
        </button>

        <ul className="hidden md:flex items-center gap-10">
          {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className={`transition-colors text-xs uppercase tracking-[0.26em] font-semibold ${
                  isScrolled
                    ? 'text-white/80 hover:text-white'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[rgba(12,12,13,0.92)] backdrop-blur-md border-b border-white/10 shadow-xl">
          <ul className="py-3">
            {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="block px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85 hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
