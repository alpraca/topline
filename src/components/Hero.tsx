import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Elegant interior"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 tracking-tight leading-tight">
          Timeless Spaces,
          <br />
          Thoughtfully Crafted
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Where tradition meets refined sensibility. We create residential interiors
          that honor craftsmanship, detail, and the art of living well.
        </p>
        <a
          href="#portfolio"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white/95 text-neutral-900 hover:bg-white transition-all duration-300 font-medium tracking-wide"
        >
          View Our Work
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}
