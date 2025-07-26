export const SECTION_IDS = {
  HERO: "hero-section",
  WHO_WE_ARE: "who-we-are",
  FEATURES: "features",
  HOW_IT_WORKS: "how-it-works",
  BOOK_A_DEMO: "book-a-demo",
  TESTIMONIALS: "testimonials",
  FAQ: "faq",
  HOME: "home",
  PRIVACY_POLICY: "privacy-policy",
  TERMS: "terms",
  CONTACT: "contact",
};

export const headerMenuItems = [
  { label: "About Us", id: SECTION_IDS.WHO_WE_ARE },
  { label: "Features", id: SECTION_IDS.FEATURES },
  { label: "How It Works", id: SECTION_IDS.HOW_IT_WORKS },
  { label: "Book Demo", id: SECTION_IDS.BOOK_A_DEMO },
  { label: "FAQ", id: SECTION_IDS.FAQ },
];

export const footerNavLinks = [
  [
    { label: "Home", id: SECTION_IDS.HOME },
    { label: "About Us", id: SECTION_IDS.WHO_WE_ARE },
    { label: "Features", id: SECTION_IDS.FEATURES },
  ],
  [
    { label: "How It Works", id: SECTION_IDS.HOW_IT_WORKS },
    { label: "Book Demo", id: SECTION_IDS.BOOK_A_DEMO },
    { label: "FAQ", id: SECTION_IDS.FAQ },
  ],
  [
    { label: "Contact", id: SECTION_IDS.CONTACT },
    { label: "Privacy Policy", id: SECTION_IDS.PRIVACY_POLICY },
    { label: "Terms of Service", id: SECTION_IDS.TERMS },
  ],
];
