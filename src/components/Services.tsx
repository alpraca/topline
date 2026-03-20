import { Home, Palette, Lightbulb, Armchair } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

const serviceIcons = [Home, Palette, Lightbulb, Armchair];

export default function Services() {
  const { siteContent } = useSiteData();

  return (
    <section className="py-24 px-6 bg-stone-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">Our Services</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            A refined approach to residential design, tailored to your vision
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {siteContent.services.map((service, index) => {
            const Icon = serviceIcons[index] || Home;

            return (
              <div
                key={`${service.title}-${index}`}
                className="bg-white p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-6 text-amber-700">
                  <Icon size={48} strokeWidth={1} />
                </div>
                <h3 className="text-xl font-serif text-neutral-900 mb-3">{service.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-neutral-600 mb-6">Every project is unique. Let's discuss yours.</p>
          <a
            href="#contact"
            className="inline-block px-10 py-4 border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 font-medium tracking-wide"
          >
            Start a Conversation
          </a>
        </div>
      </div>
    </section>
  );
}
