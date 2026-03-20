const projects = [
  {
    id: 1,
    title: 'Tribeca Residence',
    category: 'Full Home',
    image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 2,
    title: 'Park Avenue Apartment',
    category: 'Living Spaces',
    image: 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 3,
    title: 'Brooklyn Townhouse',
    category: 'Kitchen & Dining',
    image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 4,
    title: 'Upper East Side',
    category: 'Master Suite',
    image: 'https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 5,
    title: 'Greenwich Village',
    category: 'Study & Library',
    image: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 6,
    title: 'Hudson Yards',
    category: 'Bespoke Details',
    image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
    span: 'md:col-span-2 md:row-span-1'
  }
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-24 px-6 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">Selected Work</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            A collection of carefully curated spaces that embody our commitment to enduring design
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[300px]">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`group relative overflow-hidden bg-neutral-200 ${project.span} cursor-pointer`}
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-sm text-white/80 mb-1 tracking-wider uppercase">{project.category}</p>
                <h3 className="text-2xl font-serif text-white">{project.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
