import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Category = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  title: string;
  categoryId: string;
  images: string[];
  span: string;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

export type ServiceCopy = {
  title: string;
  description: string;
};

export type SiteContent = {
  portfolioSubtitle: string;
  contactHeadingLine1: string;
  contactHeadingLine2: string;
  contactIntro: string;
  contactStudioLabel: string;
  contactPhoneLabel: string;
  contactEmailLabel: string;
  contactAddressLine1: string;
  contactAddressLine2: string;
  contactPhoneDisplay: string;
  contactPhoneE164: string;
  contactEmail: string;
  whatsappButtonText: string;
  whatsappPrefillMessage: string;
  footerBrandTitle: string;
  footerBrandDescription: string;
  services: ServiceCopy[];
};

type ProjectInput = {
  title: string;
  categoryId: string;
  images: string[];
  span: string;
};

type SiteDataContextType = {
  categories: Category[];
  projects: Project[];
  inquiries: Inquiry[];
  siteContent: SiteContent;
  createCategory: (name: string) => string;
  saveProject: (input: ProjectInput, projectId?: string) => void;
  deleteProject: (projectId: string) => void;
  addInquiry: (input: Omit<Inquiry, 'id' | 'createdAt'>) => void;
  updateSiteContent: (updater: (current: SiteContent) => SiteContent) => void;
};

const STORAGE_KEYS = {
  categories: 'topline-categories-v1',
  projects: 'topline-projects-v1',
  inquiries: 'topline-inquiries-v1',
  siteContent: 'topline-site-content-v1'
};

const defaultCategories: Category[] = [
  { id: 'full-home', name: 'Full Home' },
  { id: 'living-spaces', name: 'Living Spaces' },
  { id: 'kitchen-dining', name: 'Kitchen & Dining' },
  { id: 'master-suite', name: 'Master Suite' },
  { id: 'study-library', name: 'Study & Library' },
  { id: 'bespoke-details', name: 'Bespoke Details' }
];

const defaultProjects: Project[] = [
  {
    id: 'tribeca-residence',
    title: 'Tribeca Residence',
    categoryId: 'full-home',
    images: [
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 'park-avenue-apartment',
    title: 'Park Avenue Apartment',
    categoryId: 'living-spaces',
    images: [
      'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6585750/pexels-photo-6585750.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/6489092/pexels-photo-6489092.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'brooklyn-townhouse',
    title: 'Brooklyn Townhouse',
    categoryId: 'kitchen-dining',
    images: [
      'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/5825570/pexels-photo-5825570.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/5824899/pexels-photo-5824899.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'upper-east-side',
    title: 'Upper East Side',
    categoryId: 'master-suite',
    images: [
      'https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'greenwich-village',
    title: 'Greenwich Village',
    categoryId: 'study-library',
    images: [
      'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/3747517/pexels-photo-3747517.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'hudson-yards',
    title: 'Hudson Yards',
    categoryId: 'bespoke-details',
    images: [
      'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?auto=compress&cs=tinysrgb&w=1200',
      'https://images.pexels.com/photos/4846461/pexels-photo-4846461.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ],
    span: 'md:col-span-2 md:row-span-1'
  }
];

const defaultSiteContent: SiteContent = {
  portfolioSubtitle:
    'A collection of carefully curated spaces that embody our commitment to enduring design',
  contactHeadingLine1: "Let's Create",
  contactHeadingLine2: 'Something Beautiful',
  contactIntro:
    "We welcome the opportunity to discuss your project. Whether you're planning a complete renovation or seeking guidance on a single room, we're here to help.",
  contactStudioLabel: 'Studio',
  contactPhoneLabel: 'Phone',
  contactEmailLabel: 'Email',
  contactAddressLine1: '123 Madison Avenue',
  contactAddressLine2: 'New York, NY 10016',
  contactPhoneDisplay: '+1 (212) 555-0123',
  contactPhoneE164: '12125550123',
  contactEmail: 'hello@studiointerieur.com',
  whatsappButtonText: 'Message on WhatsApp',
  whatsappPrefillMessage: 'Hi, I would like help with my interior design project.',
  footerBrandTitle: 'Studio Interieur',
  footerBrandDescription:
    'Crafting timeless residential spaces with refined sensibility and unwavering attention to detail.',
  services: [
    {
      title: 'Full-Home Design',
      description:
        'Comprehensive residential design from concept to completion, ensuring every room flows seamlessly into the next.'
    },
    {
      title: 'Material & Finish Selection',
      description:
        'Curated selection of materials, textiles, and finishes that bring warmth, texture, and timeless elegance.'
    },
    {
      title: 'Custom Lighting Design',
      description:
        'Thoughtfully designed lighting schemes that enhance mood, highlight architecture, and create atmosphere.'
    },
    {
      title: 'Furniture & Art Curation',
      description:
        'Sourcing and commissioning bespoke pieces that complement your space and reflect your personal taste.'
    }
  ]
};

const SiteDataContext = createContext<SiteDataContextType | null>(null);

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function slugify(name: string) {
  return normalizeName(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);

  useEffect(() => {
    const rawCategories = localStorage.getItem(STORAGE_KEYS.categories);
    const rawProjects = localStorage.getItem(STORAGE_KEYS.projects);
    const rawInquiries = localStorage.getItem(STORAGE_KEYS.inquiries);
    const rawSiteContent = localStorage.getItem(STORAGE_KEYS.siteContent);

    if (rawCategories) {
      setCategories(JSON.parse(rawCategories));
    }

    if (rawProjects) {
      setProjects(JSON.parse(rawProjects));
    }

    if (rawInquiries) {
      setInquiries(JSON.parse(rawInquiries));
    }

    if (rawSiteContent) {
      setSiteContent({ ...defaultSiteContent, ...JSON.parse(rawSiteContent) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.siteContent, JSON.stringify(siteContent));
  }, [siteContent]);

  const createCategory = (name: string) => {
    const cleaned = normalizeName(name);

    if (!cleaned) {
      return '';
    }

    const existing = categories.find(
      (category) => category.name.toLowerCase() === cleaned.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const baseSlug = slugify(cleaned) || makeId('category');
    let nextSlug = baseSlug;
    let counter = 2;

    while (categories.some((category) => category.id === nextSlug)) {
      nextSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const nextCategory = {
      id: nextSlug,
      name: cleaned
    };

    setCategories((current) => [...current, nextCategory]);

    return nextCategory.id;
  };

  const saveProject = (input: ProjectInput, projectId?: string) => {
    if (projectId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId
            ? {
                ...project,
                title: input.title,
                categoryId: input.categoryId,
                images: input.images,
                span: input.span
              }
            : project
        )
      );

      return;
    }

    const newProject: Project = {
      id: makeId('project'),
      title: input.title,
      categoryId: input.categoryId,
      images: input.images,
      span: input.span
    };

    setProjects((current) => [newProject, ...current]);
  };

  const deleteProject = (projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
  };

  const addInquiry = (input: Omit<Inquiry, 'id' | 'createdAt'>) => {
    const nextInquiry: Inquiry = {
      id: makeId('inquiry'),
      createdAt: new Date().toISOString(),
      ...input
    };

    setInquiries((current) => [nextInquiry, ...current]);
  };

  const updateSiteContent = (updater: (current: SiteContent) => SiteContent) => {
    setSiteContent((current) => updater(current));
  };

  const value = useMemo(
    () => ({
      categories,
      projects,
      inquiries,
      siteContent,
      createCategory,
      saveProject,
      deleteProject,
      addInquiry,
      updateSiteContent
    }),
    [categories, projects, inquiries, siteContent]
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(SiteDataContext);

  if (!context) {
    throw new Error('useSiteData must be used inside SiteDataProvider');
  }

  return context;
}
