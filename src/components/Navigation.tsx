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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center">
          <h1
            className={`text-2xl font-serif transition-colors ${
              isScrolled ? 'text-neutral-900' : 'text-white'
            }`}
          >
            Studio Intérieur
          </h1>
        </a>

        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled ? 'text-neutral-900' : 'text-white'} />
          ) : (
            <Menu className={isScrolled ? 'text-neutral-900' : 'text-white'} />
          )}
        </button>

        <ul className="hidden md:flex items-center gap-8">
          {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className={`transition-colors font-medium tracking-wide ${
                  isScrolled
                    ? 'text-neutral-700 hover:text-neutral-900'
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg">
          <ul className="py-4">
            {['Portfolio', 'About', 'Services', 'Contact'].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="block px-6 py-3 text-neutral-700 hover:bg-neutral-50 transition-colors"
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
