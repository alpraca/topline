import { useMemo, useState } from 'react';
import { useSiteData } from '../context/SiteDataContext';

export default function Portfolio() {
  const { projects, categories, siteContent } = useSiteData();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((accumulator, category) => {
      accumulator[category.id] = category.name;
      return accumulator;
    }, {});
  }, [categories]);

  const filteredProjects = useMemo(() => {
    if (!activeCategory) {
      return projects;
    }

    return projects.filter((project) => project.categoryId === activeCategory);
  }, [activeCategory, projects]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  );

  const handleProjectClick = (projectId: string, categoryId: string) => {
    if (!activeCategory || activeCategory !== categoryId) {
      setActiveCategory(categoryId);
      setActiveProjectId(null);
      return;
    }

    setActiveProjectId((current) => (current === projectId ? null : projectId));
  };

  const resetAll = () => {
    setActiveCategory(null);
    setActiveProjectId(null);
  };

  return (
    <section id="portfolio" className="py-24 px-6 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">Selected Work</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {siteContent.portfolioSubtitle}
          </p>
        </div>
        {activeCategory && (
          <div className="text-center mb-8 flex flex-wrap justify-center gap-3">
            {activeProject && (
              <button
                type="button"
                onClick={() => setActiveProjectId(null)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs md:text-sm font-medium tracking-[0.06em] text-neutral-700 transition-colors duration-200 hover:border-neutral-400 hover:text-neutral-900"
              >
                  Back to {categoryNameById[activeCategory] || activeCategory}
              </button>
            )}
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-5 py-2.5 text-xs md:text-sm font-medium tracking-[0.08em] text-neutral-700 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-400 hover:text-neutral-900 hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.45)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400"></span>
              <span>
                Showing: {activeProject ? activeProject.title : categoryNameById[activeCategory] || activeCategory}
              </span>
              <span className="text-neutral-500">Reset</span>
            </button>
          </div>
        )}

        {!activeProject && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[300px]">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id, project.categoryId)}
                className={`group relative overflow-hidden bg-neutral-200 ${project.span} cursor-pointer`}
              >
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-sm text-white/80 mb-1 tracking-wider uppercase">
                    {categoryNameById[project.categoryId] || 'Uncategorized'}
                  </p>
                  <h3 className="text-2xl font-serif text-white">{project.title}</h3>
                  {activeCategory && (
                    <p className="text-xs text-white/70 mt-2 tracking-wide uppercase">View all photos</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeProject && (
          <div className="space-y-4">
            <p className="text-center text-sm uppercase tracking-[0.15em] text-neutral-500">
              {activeProject.images.length} photos in this project
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {activeProject.images.map((image, index) => (
                <div key={image} className="group relative overflow-hidden bg-neutral-200 aspect-[4/3]">
                  <img
                    src={image}
                    alt={`${activeProject.title} ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <p className="text-center text-neutral-600 mt-10">No projects found in this category yet.</p>
        )}
      </div>
    </section>
  );
}
