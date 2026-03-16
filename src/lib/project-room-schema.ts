export type ProjectRoomMediaItem = {
  id: string;
  label: string;
  type: "youtube" | "video";
  url: string;
  caption: string;
  note: string;
  thumbnail: string;
  size: "hero" | "wide" | "tall" | "standard";
};

export type ProjectRoomEntryPoint = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export type ProjectRoomTimelineItem = {
  year: string;
  title: string;
  body: string;
};

export type ProjectRoomAmbiguityItem = {
  label: string;
  value: string;
};

export type ProjectRoomArchiveLink = {
  label: string;
  href: string;
};

export type IntelligencePartyDocument = {
  version: 1;
  introKicker: string;
  introTagline: string;
  badgePrimary: string;
  badgeYears: string;
  badgePlaces: string;
  currentReadingTitle: string;
  currentReadingBody: string;
  sectionHeading: string;
  sectionDescription: string;
  entryPointsHeading: string;
  entryPointsDescription: string;
  timelineHeading: string;
  timelineDescription: string;
  roomNote: string;
  archiveLinks: ProjectRoomArchiveLink[];
  mediaItems: ProjectRoomMediaItem[];
  entryPoints: ProjectRoomEntryPoint[];
  timeline: ProjectRoomTimelineItem[];
  ambiguityScale: ProjectRoomAmbiguityItem[];
};

export function createDefaultIntelligencePartyDocument(): IntelligencePartyDocument {
  return {
    version: 1,
    introKicker: "Project room",
    introTagline:
      "A project interface for navigating the work as campaign artifact, historical echo, public intervention, and unstable proposition.",
    badgePrimary: "Campaign fiction",
    badgeYears: "2018-2019",
    badgePlaces: "Oslo / Graz / Brussels",
    currentReadingTitle: "Satire that keeps leaking into sincerity.",
    currentReadingBody:
      "The room should keep both readings alive instead of resolving them too quickly: funny, strategic, dangerous, and pedagogical at once.",
    sectionHeading: "A campaign seen from several distances.",
    sectionDescription:
      "The clips should read less like a grid of options and more like a staged drift between official pitch, public friction, and media afterlife.",
    entryPointsHeading: "Many ways in, no safe reading out.",
    entryPointsDescription:
      "Use these as guided doors into the project rather than final interpretations. Each one changes the political temperature of the same material.",
    timelineHeading: "A project that behaves like a lineage and a campaign.",
    timelineDescription: "This page should behave more like a reading environment than a catalog card: one work, several thresholds, no clean handoff between parody and proposition.",
    roomNote: "This page should behave more like a reading environment than a catalog card: one work, several thresholds, no clean handoff between parody and proposition.",
    archiveLinks: [
      { label: "artmagazine review", href: "http://www.artmagazine.cc/content104549.html" },
      { label: "Subjekt article", href: "https://subjekt.no/2018/09/18/hvit-mann-proklamerer-i-understand-white-people-i-mangfoldig-strok-kunst-eller-propaganda/" },
      { label: "The Great Replacement book reference", href: "https://www.hatjecantz.de/volksfronten-popular-fronts-7542-1.html" },
    ],
    mediaItems: [
      {
        id: "main-film",
        label: "Campaign film",
        type: "youtube",
        url: "https://www.youtube.com/embed/LMVOKQ6hIbY",
        caption: "The central project video: campaign rhetoric delivered with enough conviction to unsettle easy dismissal.",
        note: "Entry point: start here for the official pitch voice.",
        thumbnail: "https://larscuzner.com/wp-content/uploads/intelligenspartiet.jpg",
        size: "hero",
      },
      {
        id: "oslo-clip",
        label: "Oslo activation",
        type: "video",
        url: "https://pub-b53c56f5af3e471cb8b3610afdc49a36.r2.dev/Intelligenspartiet2027.mp4",
        caption: "A broader public-facing cut that lets the project operate in the register of outreach, agitation, and performance.",
        note: "Entry point: use this if you want the work to read as a live campaign machine.",
        thumbnail: "https://larscuzner.com/wp-content/uploads/the-intelligence-party-brussels.jpg",
        size: "tall",
      },
      {
        id: "street-interview",
        label: "Street interview",
        type: "youtube",
        url: "https://www.youtube.com/embed/jRMVo8HWcwo",
        caption: "The project in contact with passersby, where the satire has to survive public misunderstanding in real time.",
        note: "Entry point: watch how the script changes when it meets actual people.",
        thumbnail: "https://img.youtube.com/vi/jRMVo8HWcwo/maxresdefault.jpg",
        size: "standard",
      },
      {
        id: "broadcast-cut",
        label: "Broadcast cut",
        type: "youtube",
        url: "https://www.youtube.com/embed/ZBEsYI_y4AI",
        caption: "A media-facing version of the work where the campaign aesthetic starts to impersonate institutional seriousness.",
        note: "Entry point: useful for reading the work as a feedback loop with journalism.",
        thumbnail: "https://larscuzner.com/wp-content/uploads/the-intelligence-party-1.jpg",
        size: "wide",
      },
      {
        id: "field-footage",
        label: "Field footage",
        type: "youtube",
        url: "https://www.youtube.com/embed/o2QgghxfQLw",
        caption: "A looser field fragment that reveals the mechanics, repetition, and friction behind the public persona.",
        note: "Entry point: the work becomes more legible once you see the seams.",
        thumbnail: "https://larscuzner.com/wp-content/uploads/the-intelligence-party-2.jpg",
        size: "standard",
      },
    ],
    entryPoints: [
      {
        id: "proposal",
        label: "Policy proposal",
        eyebrow: "Entry point 01",
        title: "Read it as a proposal that weaponizes contradiction.",
        description:
          "The project argues for expanded voting rights, but stages that argument through conservative language, cultural protectionism, and strategic discomfort.",
        bullets: [
          "Universal suffrage is framed as a supposedly traditional value.",
          "The rhetoric sounds right-wing while the demand points elsewhere.",
          "The viewer is forced to decide whether the contradiction is cynical, tactical, or generative.",
        ],
      },
      {
        id: "persona",
        label: "Campaign persona",
        eyebrow: "Entry point 02",
        title: "Read it as a performed candidate entering public space.",
        description:
          "The project works because it does not remain an essay. It becomes a body, a costume, a tone of voice, a flyer, a slogan, and a repeated public encounter.",
        bullets: [
          "The candidate persona is polished enough to be mistaken for real politics.",
          "The absurd slogans keep threatening to collapse the whole operation.",
          "That instability is part of the work, not a bug in it.",
        ],
      },
      {
        id: "genealogy",
        label: "Historical genealogy",
        eyebrow: "Entry point 03",
        title: "Read it through Norway’s original Intelligenspartiet.",
        description:
          "The project borrows the historical party name to connect nineteenth-century culture wars to present-day anxieties around nation, belonging, and electoral legitimacy.",
        bullets: [
          "J.S. Welhaven and H. Wergeland become prototypes for a recurring split.",
          "Protectionism and openness are staged as cultural scripts, not settled positions.",
          "The project keeps history active instead of treating it as background decoration.",
        ],
      },
      {
        id: "reception",
        label: "Reception machine",
        eyebrow: "Entry point 04",
        title: "Read it through what critics and media do to it.",
        description:
          "The work becomes clearer when you track its reception: some frames call it necessary, some call it absurd, and many cannot decide whether it is intervention or parody.",
        bullets: [
          "Art writing validates the paradox as a legitimate artistic method.",
          "Public reaction often tries to force the work into propaganda or mockery.",
          "The project room makes that instability visible instead of smoothing it away.",
        ],
      },
    ],
    timeline: [
      {
        year: "1830s",
        title: "Original Intelligenspartiet",
        body: "The historical party name anchors the work in an earlier cultural-political split around nationalism, influence, and the future of the nation.",
      },
      {
        year: "2018",
        title: "Graz campaign fiction",
        body: "The Intelligence Party appears as a fictional-yet-operational campaign platform, staged with enough realism to circulate beyond art-space irony.",
      },
      {
        year: "2018",
        title: "Critical response",
        body: "Reviews and art writing frame the project as timely because it inserts a left demand into a right rhetorical shell without resolving the contradiction.",
      },
      {
        year: "2019",
        title: "Oslo and Brussels afterlife",
        body: "The work continues as a distributed campaign form, migrating between contexts and gathering new meanings as it travels.",
      },
    ],
    ambiguityScale: [
      { label: "Satire", value: "Uses mimicry, excess, and wrong-sounding slogans to destabilize political speech." },
      { label: "Tool", value: "Behaves like an actual campaign apparatus with legible outreach and repeated messaging." },
      { label: "Warning", value: "Shows how easily public language can host contradictory commitments without collapsing." },
      { label: "Proposal", value: "Keeps open the possibility that tactical contradiction can still produce political thought." },
    ],
  };
}

export function normalizeIntelligencePartyDocument(value: unknown): IntelligencePartyDocument {
  const fallback = createDefaultIntelligencePartyDocument();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const item = value as Partial<IntelligencePartyDocument>;

  return {
    version: 1,
    introKicker: typeof item.introKicker === "string" ? item.introKicker : fallback.introKicker,
    introTagline: typeof item.introTagline === "string" ? item.introTagline : fallback.introTagline,
    badgePrimary: typeof item.badgePrimary === "string" ? item.badgePrimary : fallback.badgePrimary,
    badgeYears: typeof item.badgeYears === "string" ? item.badgeYears : fallback.badgeYears,
    badgePlaces: typeof item.badgePlaces === "string" ? item.badgePlaces : fallback.badgePlaces,
    currentReadingTitle: typeof item.currentReadingTitle === "string" ? item.currentReadingTitle : fallback.currentReadingTitle,
    currentReadingBody: typeof item.currentReadingBody === "string" ? item.currentReadingBody : fallback.currentReadingBody,
    sectionHeading: typeof item.sectionHeading === "string" ? item.sectionHeading : fallback.sectionHeading,
    sectionDescription: typeof item.sectionDescription === "string" ? item.sectionDescription : fallback.sectionDescription,
    entryPointsHeading: typeof item.entryPointsHeading === "string" ? item.entryPointsHeading : fallback.entryPointsHeading,
    entryPointsDescription:
      typeof item.entryPointsDescription === "string" ? item.entryPointsDescription : fallback.entryPointsDescription,
    timelineHeading: typeof item.timelineHeading === "string" ? item.timelineHeading : fallback.timelineHeading,
    timelineDescription:
      typeof item.timelineDescription === "string" ? item.timelineDescription : fallback.timelineDescription,
    roomNote: typeof item.roomNote === "string" ? item.roomNote : fallback.roomNote,
    archiveLinks:
      Array.isArray(item.archiveLinks) && item.archiveLinks.length > 0
        ? (item.archiveLinks as ProjectRoomArchiveLink[])
        : fallback.archiveLinks,
    mediaItems: Array.isArray(item.mediaItems) && item.mediaItems.length > 0 ? (item.mediaItems as ProjectRoomMediaItem[]) : fallback.mediaItems,
    entryPoints: Array.isArray(item.entryPoints) && item.entryPoints.length > 0 ? (item.entryPoints as ProjectRoomEntryPoint[]) : fallback.entryPoints,
    timeline: Array.isArray(item.timeline) && item.timeline.length > 0 ? (item.timeline as ProjectRoomTimelineItem[]) : fallback.timeline,
    ambiguityScale:
      Array.isArray(item.ambiguityScale) && item.ambiguityScale.length > 0
        ? (item.ambiguityScale as ProjectRoomAmbiguityItem[])
        : fallback.ambiguityScale,
  };
}
