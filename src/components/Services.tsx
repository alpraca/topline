import { Home, Palette, Lightbulb, Armchair } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

const serviceIcons = [Home, Palette, Lightbulb, Armchair];

export default function Services() {
  const { siteContent } = useSiteData();

  return (
    <section id="services" className="section-shell py-20 md:py-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <p className="lux-caption mb-4">Services</p>
          <h2 className="section-title text-white mb-4">Our Services</h2>
          <p className="text-sm md:text-base text-white/65 max-w-xl mx-auto">
            A refined approach to residential design, tailored to your vision
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {siteContent.services.map((service, index) => {
            const Icon = serviceIcons[index] || Home;

            return (
              <div
                key={`${service.title}-${index}`}
                className="panel-shell p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="icon-chip w-12 h-12 mb-6">
                  <Icon size={26} strokeWidth={1.9} />
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white mb-3">{service.title}</h3>
                <p className="text-white/70 leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/65 mb-6 text-sm md:text-base">Every project is unique. Let's discuss yours.</p>
          <a
            href="#contact"
            className="inline-block px-10 py-4 border border-white/50 text-white hover:bg-white hover:text-black transition-all duration-300 font-semibold uppercase text-xs tracking-[0.18em]"
          >
            Start a Conversation
          </a>
        </div>
      </div>
    </section>
  );
}
