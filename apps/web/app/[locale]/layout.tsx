import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { StaleBuildGuard } from "@/components/layout/stale-build-guard";
import { TopBar } from "@/components/layout/topbar";
import { fontVariables } from "@/lib/fonts";
import { PUBLIC_LOCALES, dir, getTranslations, isLocale, type Locale, languageAlternates } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { APP_TITLE_SCRIPT } from "@/lib/app-title-script";
import { SW_REGISTER_SCRIPT } from "@/lib/sw-register-script";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { organization, parentOrganization, website } from "@/lib/structured-data";

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getTranslations(locale);
  return {
    // Leads with what people search for. The tagline is brand voice and lives
    // on the page itself; a title tag has ~60 characters to earn a click.
    title: { default: t("seo.homeTitle"), template: "%s · EgyKode Academy" },
    description: t("seo.homeDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates((locale) => `/${locale}`, { xDefault: true }),
    },
    openGraph: {
      siteName: "EgyKode Academy",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      url: `/${locale}`,
      // The dimensions must match the file. Scrapers lay the card out from
      // these numbers before the image arrives, so declaring 800x800 for a
      // 1408x768 file gets the preview cropped or letterboxed by whoever
      // trusted the declaration.
      images: [
        {
          url: "/brand/mark-dark-source.png",
          width: 1408,
          height: 768,
          alt: "EgyKode Academy — Cloud & DevOps, free and in the open",
        },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typed = locale as Locale;
  const t = getTranslations(typed);

  // Multi-entity graph connecting EgyKode parent company to EgyKode Academy
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      parentOrganization(),
      organization(),
      website(typed),
    ],
  };

  return (
    <html lang={typed} dir={dir(typed)} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: APP_TITLE_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={typed === "ar" ? "font-arabic antialiased" : "font-sans antialiased"}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
        >
          {t("nav.skipToContent")}
        </a>

        <TopBar locale={typed} />

        {/* pb-20 on mobile so the fixed bottom bar never covers content. */}
        <main id="main" className="animate-page pb-20 md:pb-0">
          {children}
        </main>

        <StaleBuildGuard />

        <MobileNav
          locale={typed}
          // Four primary destinations plus "More". Roadmaps and Learn are how
          // people arrive; Courses and Labs are how they get through it.
          items={[
            { key: "roadmaps", label: t("nav.roadmaps") },
            { key: "learn", label: t("nav.learn") },
            { key: "topics", label: t("nav.topics") },
            { key: "courses", label: t("nav.courses") },
          ]}
          // Labs sits here rather than on the bar, but it is still one tap from
          // every chapter and topic page, which is where someone reaches for it.
          more={[
            { key: "labs", label: t("nav.labs") },
            { key: "projects", label: t("nav.projects") },
            { key: "interview", label: t("nav.interview"), path: "prepare/questions" },
            { key: "jobs", label: t("nav.jobs") },
            { key: "community", label: t("nav.community") },
          ]}
          moreLabel={t("nav.more")}
        />

        <footer className="mt-24 border-t">
          <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-10 text-sm text-content-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <p>
                {t("footer.builtWith")} {t("footer.license")}
              </p>
              <span className="hidden text-content-subtle sm:inline">•</span>
              <p className="text-xs text-content-muted">
                {typed === "ar" ? "إحدى مبادرات منظومة " : "An official ecosystem product of "}
                <a
                  href="https://egykode.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:underline"
                >
                  EgyKode
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://pilot.egykode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-content"
              >
                Pilot
              </a>
              <a
                href="https://craft.egykode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-content"
              >
                Craft
              </a>
              <Link
                href={SITE.repo}
                className="transition-colors hover:text-content"
              >
                {t("footer.contribute")} →
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
