import { ArrowRight } from 'lucide-react';
import { useParallax } from '../utils/useParallax';
import { useInView } from '../utils/useInView';

export default function Hero() {
  const imageOffset = useParallax(0.3, 240);
  const contentOffset = useParallax(0.13, 120);
  const [textRef, isVisible] = useInView();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Elegant interior"
          className="w-full h-[112%] object-cover will-change-transform"
          style={{ transform: `translate3d(0, ${-imageOffset}px, 0) scale(1.06)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75"></div>
        <div className="absolute inset-0 grain-overlay"></div>
      </div>

      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-28 md:pt-32 will-change-transform"
        style={{ transform: `translate3d(0, ${-contentOffset}px, 0)` }}
      >
        <div ref={textRef} className={`max-w-5xl ${isVisible ? 'hero-intro' : ''}`}>
          <p className="lux-caption mb-5">Curated Residential Interiors</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-[0.96] max-w-4xl">
            Sculpted Interiors
            <br />
            For Modern Living
          </h1>
          <p className="text-sm md:text-base text-white/80 mb-10 max-w-xl leading-relaxed">
            Architectural calm, rich materiality, and one-of-a-kind atmosphere.
          </p>
          <a
            href="#portfolio"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white/90 text-neutral-900 hover:bg-white transition-all duration-300 font-semibold uppercase text-xs tracking-[0.18em]"
          >
            Explore Projects
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <div className="absolute -bottom-1 left-0 right-0 h-36 bg-gradient-to-t from-[var(--paper)] to-transparent"></div>
    </section>
  );
}
