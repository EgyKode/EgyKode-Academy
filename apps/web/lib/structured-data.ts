import { SITE } from "@/lib/site";

/**
 * Schema.org structured data (MASTER_PROMPT §12.2).
 *
 * Search engines rank a page on what it is, not only on the words in it. A
 * chapter that declares itself a `LearningResource` with a level, a time
 * commitment and a teaching organisation behind it is legible in a way that
 * prose alone is not — and it is what makes course carousels, FAQ results and
 * sitelink search boxes possible.
 *
 * Every claim here must be true of the page it describes. Marking a
 * placeholder as a `Course`, or an unanswered question as an FAQ, is the kind
 * of thing that earns a manual action rather than a rich result.
 */

const url = (path: string) => `${SITE.url}${path}`;

/**
 * A page URL in canonical form — always with a trailing slash, matching
 * `<link rel="canonical">` and the sitemap.
 *
 * The production build sets `trailingSlash: true`, so `/en/labs` is a 308 to
 * `/en/labs/`. Structured data is crawled like anything else, so emitting the
 * unslashed form pointed Google at a redirect for every breadcrumb it followed
 * — which is what Search Console was reporting as "Page with redirect", mostly
 * on lab and chapter pages, because those are what breadcrumbs point at.
 *
 * Fragments and files are left exactly as given: `/#organization` is an `@id`
 * rather than a page, and `/icon.svg` is a file.
 */
const pageUrl = (path: string) =>
  url(/[.#]/.test(path) || path.endsWith("/") ? path : `${path}/`);

/** The parent corporate entity: EgyKode. */
export function parentOrganization() {
  return {
    "@type": "Organization",
    "@id": "https://egykode.com/#organization",
    name: "EgyKode",
    url: "https://egykode.com/",
    logo: {
      "@type": "ImageObject",
      url: "https://egykode.com/brand/logo.jpeg",
    },
    description:
      "EgyKode is a technology, software, and cloud engineering company building enterprise platforms, cloud architectures, and digital products.",
    founder: {
      "@type": "Person",
      "@id": "https://egykode.com/#founder",
      name: "Waleed Darwesh",
      jobTitle: "Founder & Chief Architect",
      sameAs: [
        "https://www.linkedin.com/in/waleeddarwesh1/",
        "https://github.com/Waleeddarwesh",
      ],
    },
    sameAs: [
      "https://www.linkedin.com/company/egykode",
      "https://github.com/EgyKode",
    ],
  };
}

/** The educational organization (EgyKode Academy), sub-entity of EgyKode. */
export function organization() {
  return {
    "@type": "EducationalOrganization",
    "@id": url("/#organization"),
    name: "EgyKode Academy",
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: url("/icon.svg"),
    },
    description:
      "Open-source Cloud and DevOps learning initiative by EgyKode — structured chapters, hands-on labs, roadmaps and deployable projects.",
    parentOrganization: {
      "@id": "https://egykode.com/#organization",
    },
    founder: {
      "@type": "Person",
      "@id": "https://egykode.com/#founder",
      name: "Waleed Darwesh",
      sameAs: [
        "https://www.linkedin.com/in/waleeddarwesh1/",
        "https://github.com/Waleeddarwesh",
      ],
    },
    sameAs: [SITE.repo, "https://github.com/EgyKode"].filter(Boolean),
  };
}

/**
 * The site itself.
 *
 * Deliberately no `SearchAction`: it produces the sitelinks search box, but
 * only when a real URL accepts a query parameter. Search here is a command
 * palette with no `/search?q=` route, so declaring one would point Google at a
 * 404 — add it the day that route exists, not before.
 */
export function website(locale: string) {
  return {
    "@type": "WebSite",
    "@id": url("/#website"),
    url: SITE.url,
    name: "EgyKode Academy",
    inLanguage: locale,
    publisher: { "@id": "https://egykode.com/#organization" },
    provider: { "@id": url("/#organization") },
    author: {
      "@type": "Person",
      "@id": "https://egykode.com/#founder",
      name: "Waleed Darwesh",
      sameAs: [
        "https://www.linkedin.com/in/waleeddarwesh1/",
        "https://github.com/Waleeddarwesh",
      ],
    },
  };
}

/** A chapter: a free learning resource, with its level and reading time. */
export function learningResource(chapter: {
  title: string;
  description: string;
  path: string;
  level: string;
  readingTime: number;
  updated: string;
  locale: string;
  keywords: string[];
  /** "Chapter" for reading, "Lab" for something you run. */
  resourceType?: string;
}) {
  return {
    "@type": "LearningResource",
    "@id": pageUrl(chapter.path) + "#resource",
    name: chapter.title,
    description: chapter.description,
    url: pageUrl(chapter.path),
    inLanguage: chapter.locale,
    learningResourceType: chapter.resourceType ?? "Chapter",
    educationalLevel: chapter.level,
    // ISO 8601 duration — "PT45M" for a 45-minute read.
    timeRequired: `PT${chapter.readingTime}M`,
    dateModified: chapter.updated,
    keywords: chapter.keywords.join(", "),
    isAccessibleForFree: true,
    provider: { "@id": url("/#organization") },
    publisher: { "@id": "https://egykode.com/#organization" },
  };
}

/** A roadmap: an ordered course made of chapters. */
export function course(roadmap: {
  title: string;
  description: string;
  path: string;
  locale: string;
  chapters: number;
}) {
  return {
    "@type": "Course",
    "@id": pageUrl(roadmap.path) + "#course",
    name: roadmap.title,
    description: roadmap.description,
    url: pageUrl(roadmap.path),
    inLanguage: roadmap.locale,
    isAccessibleForFree: true,
    provider: { "@id": url("/#organization") },
    publisher: { "@id": "https://egykode.com/#organization" },
    // Required by Google for Course rich results.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${roadmap.chapters * 45}M`,
    },
  };
}

/**
 * The interview question bank as an FAQ.
 *
 * Only valid because every answer is present in the page's HTML — collapsed
 * behind a toggle, which Google explicitly permits, but never absent.
 */
export function faqPage(
  questions: { question: string; answer: string }[],
  path: string,
) {
  return {
    "@type": "FAQPage",
    "@id": pageUrl(path) + "#faq",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

/** Trail shown under the result in search. */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: pageUrl(crumb.path),
    })),
  };
}

/** Wraps one or more nodes in a single `@graph` document. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
