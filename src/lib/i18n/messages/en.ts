/**
 * All user-facing copy.
 *
 * The MVP ships English only, but no string is inlined in JSX. Adding pt-BR
 * later is then a new file plus a locale switch, rather than an archaeology
 * expedition through every component. See docs/PLAN.md §13.
 */
export const messages = {
  brand: {
    name: "co-fe",
    tagline: "Find a cafe where you can actually work.",
  },
  nav: {
    explore: "Explore",
    score: "The score",
    contribute: "Contribute",
    github: "GitHub",
    skipToContent: "Skip to content",
  },
  home: {
    heroTitle: "Find a café where you can actually work.",
    heroSubtitle:
      "Wi-Fi, power, quiet and a table that fits a laptop. Community-checked, openly licensed.",
    searchPlaceholder: "Search cafés, neighborhoods or cities...",
    searchLabel: "Search for a place",
    cta: "Find cafés",
    useLocation: "or use my current location",
    nearbyTitle: "Cafés in the demo dataset",
    nearbySubtitle: "A small hand-written sample so the app has something to show.",
    scoreTitle: "How the Work Friendly Score works",
    scoreSubtitle:
      "One number, five things we can actually observe, and the arithmetic shown in full.",
    scoreLink: "See the full method",
    contributeTitle: "Know a good one?",
    contributeSubtitle:
      "co-fe is only as good as the people who fill it in. Adding a café takes a couple of minutes.",
    contributeCta: "Add a café",
    exploreCta: "Open the map",
  },
  explore: {
    title: "Explore cafés",
    titleFor: (query: string) => `Cafés matching “${query}”`,
    resultsCount: (count: number) => `${count} ${count === 1 ? "café" : "cafés"}`,
    noResults: "No cafés match these filters",
    noResultsHint: "Try removing a filter, or searching a different area.",
    emptyArea: "Nothing here yet",
    emptyAreaHint:
      "The demo dataset only covers a few neighbourhoods. Try searching São Paulo, or add the cafés you know.",
    clearFilters: "Clear filters",
    filters: "Filters",
    filtersApplied: (count: number) => `${count} applied`,
    showMap: "Map",
    showList: "List",
    searchThisArea: "Search this area",
    searchingArea: "Searching...",
    noCafesHere: (place: string) => `No cafés in ${place} yet`,
    noCafesHereHint:
      "We found the place, we just have no data for it. If you know somewhere good there, adding it takes a couple of minutes.",
    addFirstCafe: "Add the first café",
    showingNear: (place: string) => `Showing cafés near ${place}`,
    selectedCafe: "Selected café",
    locating: "Finding your location...",
    locationDenied: "Location unavailable. Search for a place instead.",
    listLabel: "Cafés matching your filters",
  },
  cafe: {
    workProfile: "Work profile",
    scoreBreakdown: "Why this score",
    amenities: "Good to know",
    notes: "From the community",
    noNotes: "No notes yet.",
    openingHours: "Opening hours",
    address: "Address",
    website: "Website",
    lastUpdated: "Last updated",
    neverReported: "Never",
    dataSource: "Data source",
    notEnoughData: "Not enough data yet",
    notEnoughDataHint:
      "Fewer than two reports, so we are not publishing a score. A number built on one opinion would be misleading.",
    reportCount: (count: number) => `${count} ${count === 1 ? "report" : "reports"}`,
    noRating: "Not rated",
    unknown: "Unknown",
    yes: "Yes",
    no: "No",
    weight: "Weight",
    contribution: "Points",
    backToExplore: "Back to all cafés",
    improveCta: "Something out of date? Update this café",
    notFound: "We could not find that café",
    notFoundHint: "It may have been removed, or the link may be wrong.",
  },
  contribute: {
    title: "Add a café",
    subtitle:
      "Somewhere you have actually worked. It takes a couple of minutes, and a moderator checks it before it goes live.",
    submit: "Submit for review",
    thanksTitle: "Thank you — it is in the queue",
    thanksBody:
      "A moderator will review it shortly. Once approved it appears on the map and starts counting towards a Work Friendly Score.",
    reportTitle: "Update this café",
    reportSubtitle: "Something changed, or you have your own take? Add a report.",
    moderation: {
      title: "Moderation queue",
      empty: "Nothing waiting. The queue is clear.",
      approve: "Approve",
      reject: "Reject",
      pendingCafes: "Cafés awaiting review",
      pendingReports: "Reports awaiting review",
      signIn: "Moderator access",
      signInHint: "Enter the moderation token to review submissions.",
      signInCta: "Unlock",
      signOut: "Lock again",
      wrongToken: "That token is not right.",
    },
  },
  score: {
    title: "The Work Friendly Score",
    subtitle: "One number, five observable things, and no black boxes.",
  },
  demo: {
    badge: "Demo data",
    tooltip:
      "This is hand-written sample data for development, not a real report about a real café.",
    bannerTitle: "You are looking at demo data",
    bannerBody:
      "co-fe ships with a small fictional dataset so the app is usable before real contributions arrive. Nothing here describes a real café.",
  },
  common: {
    loading: "Loading",
    retry: "Try again",
    error: "Something went wrong",
    errorHint: "This one is on us. Refreshing usually helps.",
    dismiss: "Dismiss",
    close: "Close",
  },
  footer: {
    builtWith: "Open source, built by the community.",
    codeLicense: "Code: MIT",
    dataLicense: "Data: ODbL",
    osmAttribution: "Map data © OpenStreetMap contributors",
  },
} as const;

export type Messages = typeof messages;
