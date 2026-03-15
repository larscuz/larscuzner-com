export type HomeHeroSection = {
  id: string;
  type: "hero";
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
};

export type HomeBookHeroSection = {
  id: string;
  type: "bookHero";
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  secondaryCtaLabel: string;
  featuredPostSourceId: number | null;
  fallbackFeaturedSlug: string;
  featuredVideoUrl: string;
};

export type HomeFeaturedWorkSection = {
  id: string;
  type: "featuredWork";
  enabled: boolean;
  eyebrow: string;
  title: string;
  emptyText: string;
  ctaLabel: string;
  featuredPostSourceId: number | null;
};

export type HomeEntryPointsSection = {
  id: string;
  type: "entryPoints";
  enabled: boolean;
  eyebrow: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
  }>;
};

export type HomePagesSpotlightSection = {
  id: string;
  type: "pagesSpotlight";
  enabled: boolean;
  eyebrow: string;
  title: string;
};

export type HomeRecentWorksSection = {
  id: string;
  type: "recentWorks";
  enabled: boolean;
  eyebrow: string;
  title: string;
  ctaLabel: string;
};

export type HomeSection =
  | HomeBookHeroSection
  | HomeHeroSection
  | HomeFeaturedWorkSection
  | HomeEntryPointsSection
  | HomePagesSpotlightSection
  | HomeRecentWorksSection;

export type HomePageDocument = {
  version: 1;
  sections: HomeSection[];
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultBookHeroSection(): HomeBookHeroSection {
  return {
    id: "book-hero-main",
    type: "bookHero",
    enabled: true,
    eyebrow: "Featured motion",
    title: "Play the project before you read it.",
    description:
      "A video-led homepage stage that foregrounds recovered motion, stills, and text from a selected work.",
    ctaLabel: "Play feature",
    secondaryCtaLabel: "View project",
    featuredPostSourceId: null,
    fallbackFeaturedSlug: "post-2735",
    featuredVideoUrl: "https://pub-b53c56f5af3e471cb8b3610afdc49a36.r2.dev/Intelligenspartiet2027.mp4",
  };
}

export function createDefaultHomePageDocument(): HomePageDocument {
  return {
    version: 1,
    sections: [
      createDefaultBookHeroSection(),
      {
        id: "featured-work-main",
        type: "featuredWork",
        enabled: true,
        eyebrow: "Featured work",
        title: "Featured work",
        emptyText: "No published work is available yet.",
        ctaLabel: "Open work",
        featuredPostSourceId: null,
      },
      {
        id: "recent-works-main",
        type: "recentWorks",
        enabled: true,
        eyebrow: "Recent works",
        title: "Selected published pieces",
        ctaLabel: "View all works",
      },
    ],
  };
}

export function createHomeSection(type: HomeSection["type"]): HomeSection {
  if (type === "bookHero") {
    return {
      ...createDefaultBookHeroSection(),
      id: createId("book-hero"),
    };
  }

  if (type === "hero") {
    return {
      id: createId("hero"),
      type,
      enabled: true,
      eyebrow: "New hero",
      title: "New homepage hero",
      description: "Write a short statement for this section.",
    };
  }

  if (type === "featuredWork") {
    return {
      id: createId("featured-work"),
      type,
      enabled: true,
      eyebrow: "Featured work",
      title: "Featured work",
      emptyText: "No published work is available yet.",
      ctaLabel: "Open work",
      featuredPostSourceId: null,
    };
  }

  if (type === "entryPoints") {
    return {
      id: createId("entry-points"),
      type,
      enabled: true,
      eyebrow: "Entry points",
      items: [
        {
          id: createId("entry-point"),
          title: "New link",
          description: "Describe where this section leads.",
          href: "/",
        },
      ],
    };
  }

  if (type === "pagesSpotlight") {
    return {
      id: createId("pages-spotlight"),
      type,
      enabled: true,
      eyebrow: "Public pages",
      title: "Highlight public information here.",
    };
  }

  return {
    id: createId("recent-works"),
    type: "recentWorks",
    enabled: true,
    eyebrow: "Recent works",
    title: "Selected works",
    ctaLabel: "View works",
  };
}

export function normalizeHomePageDocument(value: unknown): HomePageDocument {
  const fallback = createDefaultHomePageDocument();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<HomePageDocument>;
  if (!Array.isArray(candidate.sections)) {
    return fallback;
  }

  const sections = candidate.sections.reduce<HomeSection[]>((accumulator, section) => {
    if (!section || typeof section !== "object" || typeof (section as { type?: unknown }).type !== "string") {
      return accumulator;
    }

    if ((section as { id?: unknown }).id === "hero-main") {
      return accumulator;
    }

    const type = (section as { type: HomeSection["type"] }).type;

    if (type === "bookHero") {
      const item = section as Partial<HomeBookHeroSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("book-hero"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Featured motion",
          title: typeof item.title === "string" ? item.title : "Play the project before you read it.",
          description: typeof item.description === "string" ? item.description : "",
          ctaLabel: typeof item.ctaLabel === "string" ? item.ctaLabel : "Play feature",
          secondaryCtaLabel: typeof item.secondaryCtaLabel === "string" ? item.secondaryCtaLabel : "View project",
          featuredPostSourceId: typeof item.featuredPostSourceId === "number" ? item.featuredPostSourceId : null,
          fallbackFeaturedSlug: typeof item.fallbackFeaturedSlug === "string" ? item.fallbackFeaturedSlug : "post-2735",
          featuredVideoUrl:
            typeof item.featuredVideoUrl === "string"
              ? item.featuredVideoUrl
              : "https://pub-b53c56f5af3e471cb8b3610afdc49a36.r2.dev/Intelligenspartiet2027.mp4",
        } satisfies HomeBookHeroSection,
      );
      return accumulator;
    }

    if (type === "hero") {
      const item = section as Partial<HomeHeroSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("hero"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Hero",
          title: typeof item.title === "string" ? item.title : "Homepage hero",
          description: typeof item.description === "string" ? item.description : "",
        } satisfies HomeHeroSection,
      );
      return accumulator;
    }

    if (type === "featuredWork") {
      const item = section as Partial<HomeFeaturedWorkSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("featured-work"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Featured work",
          title: typeof item.title === "string" ? item.title : "Featured work",
          emptyText: typeof item.emptyText === "string" ? item.emptyText : "No published work is available yet.",
          ctaLabel: typeof item.ctaLabel === "string" ? item.ctaLabel : "Open work",
          featuredPostSourceId: typeof item.featuredPostSourceId === "number" ? item.featuredPostSourceId : null,
        } satisfies HomeFeaturedWorkSection,
      );
      return accumulator;
    }

    if (type === "entryPoints") {
      const item = section as Partial<HomeEntryPointsSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("entry-points"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Entry points",
          items: Array.isArray(item.items)
            ? item.items.map((entry) => ({
                id: typeof entry.id === "string" ? entry.id : createId("entry-point"),
                title: typeof entry.title === "string" ? entry.title : "Link",
                description: typeof entry.description === "string" ? entry.description : "",
                href: typeof entry.href === "string" ? entry.href : "/",
              }))
            : [],
        } satisfies HomeEntryPointsSection,
      );
      return accumulator;
    }

    if (type === "pagesSpotlight") {
      const item = section as Partial<HomePagesSpotlightSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("pages-spotlight"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Public pages",
          title: typeof item.title === "string" ? item.title : "Public pages",
        } satisfies HomePagesSpotlightSection,
      );
      return accumulator;
    }

    if (type === "recentWorks") {
      const item = section as Partial<HomeRecentWorksSection>;
      accumulator.push(
        {
          id: typeof item.id === "string" ? item.id : createId("recent-works"),
          type,
          enabled: item.enabled !== false,
          eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "Recent works",
          title: typeof item.title === "string" ? item.title : "Recent works",
          ctaLabel: typeof item.ctaLabel === "string" ? item.ctaLabel : "View all works",
        } satisfies HomeRecentWorksSection,
      );
      return accumulator;
    }

    return accumulator;
  }, []);

  const normalizedSections = sections.length > 0 ? sections : fallback.sections;
  const hasBookHero = normalizedSections.some((section) => section.type === "bookHero");

  return {
    version: 1,
    sections: hasBookHero ? normalizedSections : [createDefaultBookHeroSection(), ...normalizedSections],
  };
}
