/**
 * WiseOwl — canonical demo content for every block in the catalogue.
 *
 * Fictional personal-finance product. All people, institutions, figures and
 * domains are invented. Figures are kept consistent across blocks:
 *
 *   KEY FIGURES (single source of truth — see `FIGURES`)
 *   - 38,412 households use WiseOwl; 11,642 banks and credit unions supported
 *   - Rating 4.8/5 from 3,906 reviews
 *   - Members save $1,284.60 on average in their first six months
 *   - Plans: Free $0 · Plus $7.99/mo ($76/yr) · Household $13.99/mo ($134/yr)
 *     · Advisor $39/mo per seat
 *   - Demo household: Maya Okafor + Daniel Reyes ("okafor-reyes")
 *     net worth $184,276.52 · Sep 2026 income $9,840.00 · spending $6,412.38
 *     · saved $3,427.62 · savings rate 35%
 */

/* ------------------------------------------------------------------ */
/* Shared figures                                                      */
/* ------------------------------------------------------------------ */

export const FIGURES = {
  households: "38,412",
  institutions: "11,642",
  rating: "4.8",
  reviewCount: "3,906",
  avgSavedFirstSixMonths: "$1,284.60",
  syncUptime: "99.94%",
  countries: "3",
  founded: "2021",
  plans: {
    free: { monthly: 0, annual: 0 },
    plus: { monthly: 7.99, annual: 76 },
    household: { monthly: 13.99, annual: 134 },
    advisor: { monthly: 39, annual: 396, unit: "per advisor seat" },
  },
  demoHousehold: {
    handle: "okafor-reyes",
    name: "Okafor-Reyes Household",
    netWorth: "$184,276.52",
    netWorthChange: "+2.4%",
    incomeSep: "$9,840.00",
    spendingSep: "$6,412.38",
    savedSep: "$3,427.62",
    savingsRate: "35%",
    linkedAccounts: 7,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export const WISEOWL = {
  name: "WiseOwl",
  domain: "wiseowl.app",
  tagline: "Calm control of your money.",
  description:
    "WiseOwl brings your accounts, budgets, bills and goals into one quiet place, so you and your household always know where you stand.",
  supportEmail: "help@wiseowl.app",
  pressEmail: "press@wiseowl.app",
  developerEmail: "api@wiseowl.app",
  address: "WiseOwl Finance, Inc. · 418 SW Alder St, Portland, OR 97204",
  nav: [
    { label: "Product", href: "/product" },
    { label: "Household", href: "/household" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "/security" },
    { label: "Developers", href: "/developers" },
    { label: "Blog", href: "/blog" },
  ],
  navCtas: {
    secondary: { label: "Sign in", href: "/signin" },
    primary: { label: "Start free", href: "/signup" },
  },
  footer: {
    Product: [
      { label: "Budgets", href: "/product/budgets" },
      { label: "Savings goals", href: "/product/goals" },
      { label: "Bills & subscriptions", href: "/product/bills" },
      { label: "Net worth", href: "/product/net-worth" },
      { label: "Ask WiseOwl", href: "/product/assistant" },
      { label: "Pricing", href: "/pricing" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
    Resources: [
      { label: "Help centre", href: "/help" },
      { label: "Money guides", href: "/guides" },
      { label: "API docs", href: "/docs/api" },
      { label: "Changelog", href: "/changelog" },
      { label: "System status", href: "https://status.wiseowl.app" },
    ],
    Legal: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Security", href: "/security" },
      { label: "Cookie settings", href: "/legal/cookies" },
    ],
  },
  social: [
    { name: "GitHub", handle: "wiseowl-finance", href: "https://github.com/wiseowl-finance" },
    { name: "X", handle: "@wiseowlapp", href: "https://x.com/wiseowlapp" },
    { name: "LinkedIn", handle: "WiseOwl Finance", href: "https://linkedin.com/company/wiseowl-finance" },
    { name: "YouTube", handle: "@wiseowlapp", href: "https://youtube.com/@wiseowlapp" },
  ],
  legal:
    "© 2026 WiseOwl Finance, Inc. WiseOwl is not a bank. Account connections are read-only and encrypted with AES-256.",
} as const;

/* ------------------------------------------------------------------ */
/* People (fictional)                                                  */
/* ------------------------------------------------------------------ */

export const PEOPLE = [
  { id: "maya-okafor", name: "Maya Okafor", role: "Product designer · Household owner", city: "Portland, OR", descriptor: "Runs the family budget; shares the household with Daniel." },
  { id: "daniel-reyes", name: "Daniel Reyes", role: "High school teacher · Household editor", city: "Portland, OR", descriptor: "Tracks the car loan payoff and grocery spending." },
  { id: "priya-raman", name: "Priya Raman", role: "Nurse practitioner", city: "Columbus, OH", descriptor: "Paid off $18,420 of student loans in 22 months." },
  { id: "tomas-herrera", name: "Tomás Herrera", role: "Freelance photographer", city: "Albuquerque, NM", descriptor: "Uses income smoothing for irregular paychecks." },
  { id: "aiyana-whitehorse", name: "Aiyana Whitehorse", role: "Civil engineer", city: "Rapid City, SD", descriptor: "Saving for a first home with a 14-month goal." },
  { id: "kenji-watanabe", name: "Kenji Watanabe", role: "Software developer", city: "Seattle, WA", descriptor: "Built a spending export on the WiseOwl API." },
  { id: "fatima-alsayed", name: "Fatima Al-Sayed", role: "Pharmacist", city: "Dearborn, MI", descriptor: "Manages money for her parents through shared access." },
  { id: "marcus-bell", name: "Marcus Bell", role: "Restaurant manager", city: "Atlanta, GA", descriptor: "Cancelled four forgotten subscriptions in his first week." },
  { id: "ingrid-solberg", name: "Ingrid Solberg", role: "Retired librarian", city: "Duluth, MN", descriptor: "Watches fixed-income bills and medical costs." },
  { id: "diego-morales", name: "Diego Morales", role: "Electrician", city: "San Antonio, TX", descriptor: "Scans every job receipt for tax time." },
  { id: "amara-nwosu", name: "Amara Nwosu", role: "Graduate student", city: "Baltimore, MD", descriptor: "Lives on a $2,140 monthly stipend with a tight budget." },
  { id: "lena-hoffmann", name: "Lena Hoffmann", role: "Physical therapist", city: "Denver, CO", descriptor: "Shares a household with two teenagers on allowances." },
  { id: "samir-haddad", name: "Samir Haddad", role: "Small-business owner", city: "Paterson, NJ", descriptor: "Keeps personal and shop spending clearly separated." },
  { id: "grace-liu", name: "Grace Liu", role: "Product lead, WiseOwl", city: "Portland, OR", descriptor: "Writes the changelog and leads the household features team." },
  { id: "noor-patel", name: "Noor Patel", role: "Support specialist, WiseOwl", city: "Raleigh, NC", descriptor: "Answers member questions in chat, weekdays 8am–6pm ET." },
  { id: "rosa-delgado", name: "Rosa Delgado, CPA", role: "Accountant · Viewer access", city: "Sacramento, CA", descriptor: "Reviews client households read-only during tax season." },
] as const;

export type PersonId = (typeof PEOPLE)[number]["id"];

/* ------------------------------------------------------------------ */
/* Copy, keyed by block slug                                           */
/* ------------------------------------------------------------------ */

export const COPY: Record<string, any> = {
  /* ============================== HERO ============================== */

  "hero-centered-media": {
    overline: "Personal finance",
    headline: "Know where every dollar stands",
    sub: "WiseOwl connects your bank accounts, budgets and bills in one calm view, so money decisions take minutes instead of evenings.",
    ctas: [
      { label: "Start free", href: "/signup", variant: "primary" },
      { label: "See how it works", href: "/product", variant: "secondary" },
    ],
    trust: "Rated 4.8/5 from 3,906 reviews · 38,412 households",
    media: { kind: "photo", alt: "A couple reviewing their monthly budget on a laptop at a kitchen table in morning light" },
  },

  "hero-split-media": {
    overline: "For households",
    headline: "Plan money together, without the arguments",
    sub: "Share budgets, goals and bills with a partner or family member. Everyone sees the same numbers, and you choose who can edit.",
    ctas: [
      { label: "Start a household", href: "/signup?plan=household", variant: "primary" },
      { label: "Compare plans", href: "/pricing", variant: "secondary" },
    ],
    bullets: ["Read-only bank connections", "Owner, Editor and Viewer roles", "Free for one person, forever"],
    media: { kind: "photo", alt: "Two adults on a sofa looking at the WiseOwl household dashboard on a phone" },
  },

  "hero-video-statement": {
    overline: "Calm money",
    headline: "Less checking. More knowing.",
    sub: "Quiet alerts tell you only what matters: a bill due, a budget near its limit, a charge that looks unfamiliar.",
    ctas: [
      { label: "Start free", href: "/signup", variant: "primary" },
      { label: "Watch the 90-second tour", href: "/tour", variant: "secondary" },
    ],
    media: { kind: "video", poster: "Slow pan across a tidy desk with a phone showing a single budget alert", durationSeconds: 92 },
  },

  "hero-mesh-type": {
    overline: "WiseOwl",
    headline: "Your money, finally in one place",
    sub: "Link 11,642 banks and credit unions, see every balance and bill, and plan the month ahead in one sitting.",
    ctas: [{ label: "Create your free account", href: "/signup", variant: "primary" }],
    footnote: "No card required. Read-only access. Cancel any time.",
  },

  /* ============================ FEATURES ============================ */

  "features-bento-grid": {
    overline: "What you get",
    headline: "Everything your money needs, nothing extra",
    sub: "Four tools most households use every week, built to work together and stay out of your way the rest of the time.",
    cells: [
      { size: "wide", kind: "photo", title: "Budgets that follow real life", body: "Category budgets adjust to paydays and roll over unspent money, so a quiet month helps the next one.", media: { alt: "WiseOwl budget screen showing Groceries at $612.40 of $750" } },
      { size: "small", icon: "receipt", title: "Bills, never a surprise", body: "See every bill and subscription due in the next 30 days, with reminders two days before." },
      { size: "small", icon: "target", title: "Goals with a date", body: "Set an amount and a deadline. WiseOwl tells you exactly what to set aside each payday." },
      { size: "small", icon: "message-circle", title: "Ask about your spending", body: "Type a question like 'How much did we spend on takeout in August?' and get a sourced answer." },
    ],
  },

  "features-interactive-cards": {
    overline: "Start here",
    headline: "Three ways to get organised",
    sub: "Pick the one that matters most this month. Each takes under ten minutes and works with the accounts you already have.",
    cards: [
      { icon: "link", title: "Link your accounts", body: "Connect checking, savings, cards and loans with read-only access through your bank's secure login.", cta: { label: "Connect a bank", href: "/accounts/link" }, meta: "About 4 minutes" },
      { icon: "wallet", title: "Build a first budget", body: "WiseOwl suggests category limits from your last 90 days of spending. Adjust anything you like.", cta: { label: "Set up budget", href: "/budgets/new" }, meta: "About 6 minutes" },
      { icon: "users", title: "Invite your household", body: "Add a partner, parent or accountant and choose whether they can view or edit.", cta: { label: "Send an invite", href: "/household/invite" }, meta: "About 2 minutes" },
    ],
  },

  "features-icon-matrix": {
    overline: "Capabilities",
    headline: "Built for the whole money picture",
    sub: "Six everyday tools that cover budgets, bills, goals and security, available on web, iPhone and Android from one account.",
    items: [
      { icon: "piggy-bank", title: "Savings goals", body: "Track progress toward a home, a trip or a cushion, with a weekly amount to set aside." },
      { icon: "receipt", title: "Receipt scanning", body: "Photograph a receipt and WiseOwl splits it into line items and categories automatically." },
      { icon: "target", title: "Category budgets", body: "Set monthly limits for groceries, dining and more, with rollover for unspent amounts." },
      { icon: "users", title: "Shared households", body: "Invite a partner, family member or accountant with Owner, Editor or Viewer access." },
      { icon: "shield-check", title: "Bank-grade security", body: "Read-only connections, AES-256 encryption and two-factor sign-in on every account." },
      { icon: "bell", title: "Quiet alerts", body: "Get notified about due bills, large charges and budgets nearing their limit, nothing more." },
    ],
  },

  "features-story-split": {
    overline: "How it works",
    headline: "From scattered accounts to a plan",
    sub: "Most members finish setup in one evening. Here is what happens in the first three weeks.",
    rows: [
      { overline: "Week 1", title: "See every account together", body: "Link checking, credit cards, loans and retirement accounts. WiseOwl pulls 24 months of history and categorises it for you.", media: { alt: "Accounts list with seven linked institutions and a net worth of $184,276.52" }, align: "left" },
      { overline: "Week 2", title: "Find what is quietly leaking", body: "The subscriptions view lists every recurring charge. Members cancel an average of 3 forgotten services, worth $41.87 a month.", media: { alt: "Subscriptions list with a flagged unused streaming plan" }, align: "right" },
      { overline: "Week 3", title: "Give every payday a job", body: "Split income between bills, budgets and goals automatically, so savings happen before spending does.", media: { alt: "Payday plan dividing $4,920.00 across bills, budgets and goals" }, align: "left" },
    ],
  },

  "features-ruled-list": {
    overline: "The details",
    headline: "Small things that add up",
    sub: "The parts of WiseOwl members mention most often in reviews, after the budgets themselves.",
    items: [
      { title: "Split transactions", body: "Divide one Costco run between Groceries, Household and Gifts in two taps." },
      { title: "Custom categories", body: "Create up to 60 categories with your own names, icons and colours." },
      { title: "CSV and PDF export", body: "Download any month or year for your accountant or tax software." },
      { title: "Cash and manual accounts", body: "Track cash envelopes, a car's value or a private loan alongside bank data." },
      { title: "Rules that learn", body: "Recategorise a merchant once and WiseOwl applies it to every future charge." },
    ],
  },

  "card-feature-action": {
    state: "New",
    icon: "sparkles",
    title: "Ask WiseOwl about your spending",
    body: "Ask plain questions about your transactions and get answers with the exact charges listed underneath.",
    cta: { label: "Try a question", href: "/assistant" },
    meta: "Included in Plus and Household",
  },

  "card-article": {
    category: "Budgeting",
    title: "The 3-account system for irregular income",
    excerpt: "How freelancers can turn uneven paychecks into a steady monthly salary using one holding account and two simple rules.",
    author: { personId: "tomas-herrera", name: "Tomás Herrera" },
    date: "2026-09-24",
    dateLabel: "Sep 24, 2026",
    readTime: "7 min read",
    href: "/blog/three-account-system-irregular-income",
    media: { alt: "Notebook with three labelled columns beside a laptop" },
  },

  "card-plan-inset": {
    name: "Household",
    price: "$13.99",
    period: "per month",
    annualNote: "or $134 billed yearly (save 20%)",
    description: "For couples and families who share bills, budgets and goals.",
    features: [
      "Up to 6 household members",
      "Owner, Editor and Viewer roles",
      "Unlimited linked accounts",
      "200 AI questions per month",
      "150 receipt scans per month",
    ],
    cta: { label: "Start 14-day trial", href: "/signup?plan=household" },
    badge: "Most popular",
  },

  /* =============================== CTA =============================== */

  "cta-mesh-band": {
    headline: "Start your calmer money month",
    sub: "Join 38,412 households who check in with WiseOwl for a few minutes a week and stopped worrying about the rest.",
    ctas: [
      { label: "Start free", href: "/signup", variant: "primary" },
      { label: "Talk to us", href: "/contact", variant: "secondary" },
    ],
  },

  "cta-card-subscribe": {
    overline: "Newsletter",
    headline: "One useful money idea, every Sunday",
    sub: "A short email with one practical habit, one reader question and one chart. Read by 21,786 people. Unsubscribe in one click.",
    input: { label: "Email address", placeholder: "you@example.com", type: "email" },
    cta: { label: "Subscribe", variant: "primary" },
    footnote: "We never share your address. See our privacy policy.",
    success: "You are subscribed. The next issue arrives Sunday, Oct 11.",
  },

  "cta-conversion-banner": {
    overline: "Plus trial",
    headline: "Try Plus free for 14 days",
    sub: "Get unlimited budgets, receipt scanning and the WiseOwl assistant. We remind you three days before the trial ends.",
    ctas: [
      { label: "Start free trial", href: "/signup?plan=plus", variant: "primary" },
      { label: "Compare plans", href: "/pricing", variant: "secondary" },
    ],
    dismissLabel: "Dismiss",
  },

  /* =========================== TESTIMONIALS ========================== */

  "testimonials-spotlight": {
    overline: "Member story",
    quote:
      "We used to argue about money every month. Now we spend twenty minutes on Sunday looking at the same screen, and that's it. We paid off the car eight months early.",
    personId: "maya-okafor",
    name: "Maya Okafor",
    role: "Household owner since 2023",
    city: "Portland, OR",
    stat: { value: "8 months", label: "early car loan payoff" },
  },

  "testimonials-review-grid": {
    overline: "Reviews",
    headline: "What members say after a year",
    sub: "Rated 4.8 out of 5 from 3,906 reviews on the App Store, Google Play and Trustpilot.",
    summary: { rating: 4.8, count: 3906 },
    reviews: [
      { personId: "priya-raman", name: "Priya Raman", role: "Nurse practitioner", rating: 5, title: "Finally saw the loan end date", body: "Watching the payoff date move closer each month kept me going. $18,420 cleared in 22 months.", date: "Sep 18, 2026", source: "App Store" },
      { personId: "marcus-bell", name: "Marcus Bell", role: "Restaurant manager", rating: 5, title: "Found four forgotten subscriptions", body: "The subscriptions list paid for the app in the first week. I had no idea about two of them.", date: "Sep 9, 2026", source: "Google Play" },
      { personId: "ingrid-solberg", name: "Ingrid Solberg", role: "Retired librarian", rating: 5, title: "Clear enough for me", body: "Large text, plain words, and a reminder before each bill. My daughter set it up in an afternoon.", date: "Aug 30, 2026", source: "Trustpilot" },
      { personId: "amara-nwosu", name: "Amara Nwosu", role: "Graduate student", rating: 4, title: "Great on a tight stipend", body: "The free plan covers what I need. I wish custom category icons were available on Android too.", date: "Aug 22, 2026", source: "Google Play" },
      { personId: "diego-morales", name: "Diego Morales", role: "Electrician", rating: 5, title: "Receipts sorted for tax time", body: "I scan job receipts in the truck. My accountant gets a clean export instead of a shoebox.", date: "Aug 14, 2026", source: "App Store" },
      { personId: "lena-hoffmann", name: "Lena Hoffmann", role: "Physical therapist", rating: 5, title: "The kids can see, not spend", body: "Viewer access lets our teenagers watch their allowance goals without touching anything else.", date: "Jul 31, 2026", source: "Trustpilot" },
    ],
  },

  "testimonials-featured": {
    overline: "In their words",
    headline: "Households who stopped guessing",
    featured: {
      personId: "fatima-alsayed",
      name: "Fatima Al-Sayed",
      role: "Pharmacist · manages her parents' household",
      quote: "I can see my parents' bills from two states away and catch a missed payment before it becomes a late fee. They keep full control.",
      media: { alt: "Woman on a video call with her parents, a laptop showing a bills calendar" },
    },
    secondary: [
      { personId: "aiyana-whitehorse", name: "Aiyana Whitehorse", role: "Civil engineer", quote: "The home goal says $612 per paycheck. Knowing the exact number made it easy to stick with." },
      { personId: "samir-haddad", name: "Samir Haddad", role: "Small-business owner", quote: "Separate households for home and the shop finally stopped me mixing the two." },
    ],
  },

  "testimonials-logo-wall": {
    overline: "Connected and covered",
    headline: "Trusted by banks and the press",
    sub: "WiseOwl connects with 11,642 institutions and has been reviewed by independent personal finance writers.",
    logos: [
      { name: "Harborline Credit Union", kind: "credit-union" },
      { name: "Cascade Federal Bank", kind: "bank" },
      { name: "Pinecrest Savings", kind: "bank" },
      { name: "Meridian Trust", kind: "bank" },
      { name: "The Ledger Weekly", kind: "press" },
      { name: "Household Money Review", kind: "press" },
      { name: "Northgate Community CU", kind: "credit-union" },
      { name: "Plainspoken Finance", kind: "press" },
    ],
  },

  /* ============================= METRICS ============================= */

  "metrics-kpi-grid": {
    overline: "September 2026",
    headline: "Your month at a glance",
    kpis: [
      { label: "Net worth", value: "$184,276.52", change: "+2.4%", trend: "up", note: "vs Aug 31" },
      { label: "Spending", value: "$6,412.38", change: "-6.8%", trend: "down", sentiment: "positive", note: "vs August" },
      { label: "Income", value: "$9,840.00", change: "+0.0%", trend: "flat", note: "vs August" },
      { label: "Savings rate", value: "35%", change: "+4 pts", trend: "up", note: "vs August" },
    ],
  },

  "metrics-stats-bar": {
    stats: [
      { value: "38,412", label: "households planning with WiseOwl" },
      { value: "$1,284.60", label: "average saved in the first six months" },
      { value: "4.8/5", label: "from 3,906 member reviews" },
    ],
  },

  "metrics-trend-cards": {
    overline: "Last 7 weeks",
    headline: "Where your money is moving",
    cards: [
      { label: "Groceries per week", value: "$148.22", change: "-9.3%", trend: "down", sentiment: "positive", series: [171.4, 163.85, 158.1, 166.02, 152.47, 149.9, 148.22] },
      { label: "Emergency fund", value: "$11,460.00", change: "+5.1%", trend: "up", sentiment: "positive", series: [10905, 10990, 11080, 11160, 11250, 11370, 11460] },
      { label: "Dining out per week", value: "$96.40", change: "+12.6%", trend: "up", sentiment: "negative", series: [72.1, 85.6, 68.95, 91.3, 79.4, 85.62, 96.4] },
    ],
  },

  "card-stat-kpi": {
    label: "Groceries budget",
    value: "$612.40",
    of: "$750.00",
    progress: 0.82,
    progressLabel: "82% used · 4 days left in September",
    change: "-$37.18 vs August",
    sentiment: "positive",
  },

  /* ============================== FOOTER ============================= */

  "footer-columns": {
    brand: { name: "WiseOwl", tagline: "Calm control of your money." },
    groups: ["Product", "Company", "Resources", "Legal"],
    social: ["GitHub", "X", "LinkedIn", "YouTube"],
    legal: "© 2026 WiseOwl Finance, Inc. WiseOwl is not a bank.",
  },

  "footer-simple-centered": {
    brand: { name: "WiseOwl" },
    links: [
      { label: "Product", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "Help", href: "/help" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
    social: ["X", "LinkedIn", "YouTube"],
    legal: "© 2026 WiseOwl Finance, Inc.",
  },

  "footer-with-newsletter": {
    brand: { name: "WiseOwl", tagline: "Calm control of your money." },
    newsletter: {
      headline: "One money idea every Sunday",
      sub: "Practical habits and one reader question, read by 21,786 people each week.",
      placeholder: "you@example.com",
      cta: "Subscribe",
    },
    groups: ["Product", "Resources", "Company"],
    legal: "© 2026 WiseOwl Finance, Inc. WiseOwl is not a bank.",
  },

  "footer-sitemap": {
    brand: { name: "WiseOwl", tagline: "Calm control of your money." },
    groups: [
      { title: "Product", links: ["Budgets", "Savings goals", "Bills & subscriptions", "Net worth", "Receipt scanning", "Ask WiseOwl"] },
      { title: "Households", links: ["Couples", "Families", "Caring for parents", "Working with an accountant"] },
      { title: "Developers", links: ["API overview", "API reference", "Webhooks", "Sandbox", "Status"] },
      { title: "Resources", links: ["Help centre", "Money guides", "Budget templates", "Changelog", "Community forum"] },
      { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
      { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookie settings", "Accessibility"] },
    ],
    social: ["GitHub", "X", "LinkedIn", "YouTube"],
    legal: "© 2026 WiseOwl Finance, Inc. · 418 SW Alder St, Portland, OR 97204",
  },

  "footer-compact-single-row": {
    brand: { name: "WiseOwl" },
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Status", href: "https://status.wiseowl.app" },
      { label: "help@wiseowl.app", href: "mailto:help@wiseowl.app" },
    ],
    legal: "© 2026 WiseOwl Finance, Inc.",
  },

  /* ============================== PRICING ============================ */

  "pricing-three-tier": {
    overline: "Pricing",
    headline: "Simple plans for every household",
    sub: "Start free and upgrade when you need more. Every plan includes read-only bank connections and two-factor sign-in.",
    tiers: [
      {
        name: "Free", price: "$0", period: "forever", description: "For one person getting organised.",
        features: ["2 linked accounts", "10 budget categories", "Bill reminders", "Web and mobile apps"],
        cta: { label: "Start free", variant: "secondary" },
      },
      {
        name: "Plus", price: "$7.99", period: "per month", description: "For individuals who want the full picture.",
        features: ["Unlimited linked accounts", "Unlimited budgets and goals", "50 receipt scans per month", "75 AI questions per month", "CSV and PDF export"],
        cta: { label: "Start 14-day trial", variant: "secondary" },
      },
      {
        name: "Household", price: "$13.99", period: "per month", description: "For couples and families sharing money.", highlighted: true, badge: "Most popular",
        features: ["Everything in Plus", "Up to 6 household members", "Owner, Editor and Viewer roles", "150 receipt scans per month", "200 AI questions per month"],
        cta: { label: "Start 14-day trial", variant: "primary" },
      },
    ],
    footnote: "Prices in USD. Taxes may apply.",
  },

  "pricing-toggle": {
    overline: "Pricing",
    headline: "Pay monthly or save 20% yearly",
    sub: "Switch between plans at any time. Changes are prorated to the day, and you can cancel from settings in two clicks.",
    toggle: { options: ["Monthly", "Annual"], default: "Annual", annualBadge: "Save 20%" },
    tiers: [
      { name: "Free", monthly: "$0", annual: "$0", annualNote: "Free forever", features: ["2 linked accounts", "10 budget categories", "Bill reminders"], cta: { label: "Start free", variant: "secondary" } },
      { name: "Plus", monthly: "$7.99", annual: "$6.33", annualNote: "$76 billed yearly", features: ["Unlimited accounts and budgets", "50 receipt scans per month", "75 AI questions per month"], cta: { label: "Choose Plus", variant: "secondary" } },
      { name: "Household", monthly: "$13.99", annual: "$11.17", annualNote: "$134 billed yearly", highlighted: true, features: ["Up to 6 members with roles", "150 receipt scans per month", "200 AI questions per month"], cta: { label: "Choose Household", variant: "primary" } },
    ],
    advisorRow: {
      name: "Advisor",
      price: "$39 per advisor seat / month",
      body: "For accountants and financial planners managing client households with read-only access, notes and bulk exports.",
      cta: { label: "Talk to our team", href: "/advisors" },
    },
  },

  "pricing-comparison-matrix": {
    overline: "Compare plans",
    headline: "Every feature, side by side",
    plans: [
      { name: "Free", price: "$0" },
      { name: "Plus", price: "$7.99/mo" },
      { name: "Household", price: "$13.99/mo", highlighted: true },
    ],
    groups: [
      {
        title: "Accounts",
        rows: [
          { feature: "Linked accounts", values: ["2", "Unlimited", "Unlimited"] },
          { feature: "Transaction history", values: ["12 months", "24 months", "24 months"] },
          { feature: "Manual and cash accounts", values: [true, true, true] },
        ],
      },
      {
        title: "Planning",
        rows: [
          { feature: "Budget categories", values: ["10", "Unlimited", "Unlimited"] },
          { feature: "Savings goals", values: ["1", "Unlimited", "Unlimited"] },
          { feature: "Cash-flow forecast", values: [false, "90 days", "90 days"] },
        ],
      },
      {
        title: "Smart tools",
        rows: [
          { feature: "Receipt scans per month", values: ["5", "50", "150"] },
          { feature: "AI questions per month", values: ["10", "75", "200"] },
          { feature: "Subscription tracking", values: [true, true, true] },
        ],
      },
      {
        title: "Sharing and support",
        rows: [
          { feature: "Household members", values: ["1", "1", "Up to 6"] },
          { feature: "Roles and permissions", values: [false, false, true] },
          { feature: "Support", values: ["Email", "Email and chat", "Priority chat"] },
        ],
      },
    ],
  },

  "pricing-single-plan": {
    overline: "One plan",
    headline: "Household, billed once a year",
    sub: "Everything WiseOwl does, for your whole household, at $11.17 a month. One payment of $134, renewing each October.",
    price: "$134",
    period: "per year",
    features: [
      "Up to 6 household members",
      "Unlimited linked accounts",
      "Unlimited budgets and goals",
      "90-day cash-flow forecast",
      "150 receipt scans per month",
      "200 AI questions per month",
      "Priority chat support",
    ],
    cta: { label: "Get Household", href: "/signup?plan=household-annual", variant: "primary" },
    secondaryCta: { label: "Start 14-day trial first", href: "/signup?plan=household&trial=1", variant: "secondary" },
    guarantee: "30-day money-back guarantee. If WiseOwl is not for you, we refund the full $134, no questions asked.",
  },

  /* =============================== AUTH ============================== */

  "auth-signin": {
    headline: "Welcome back to WiseOwl",
    sub: "Sign in to see your accounts, budgets and household. Your session stays private and expires after 30 days.",
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
      { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
    ],
    remember: "Keep me signed in on this device",
    forgot: { label: "Forgot password?", href: "/forgot" },
    cta: { label: "Sign in", variant: "primary" },
    secondaryCta: { label: "Continue with Google", variant: "secondary" },
    footer: { text: "New to WiseOwl?", link: { label: "Create a free account", href: "/signup" } },
  },

  "auth-signup": {
    headline: "Create your free WiseOwl account",
    sub: "Free for one person with two linked accounts. No card required, and you can upgrade or delete your account any time.",
    fields: [
      { name: "name", label: "Full name", type: "text", placeholder: "Maya Okafor" },
      { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
      { name: "password", label: "Password", type: "password", placeholder: "At least 12 characters", hint: "Use 12+ characters with a number or symbol." },
    ],
    consent: "I agree to the Terms of Service and Privacy Policy.",
    cta: { label: "Create account", variant: "primary" },
    secondaryCta: { label: "Sign up with Google", variant: "secondary" },
    footer: { text: "Already have an account?", link: { label: "Sign in", href: "/signin" } },
  },

  "auth-forgot": {
    headline: "Reset your password",
    sub: "Enter the email on your account and we will send a reset link. It works once and expires in 30 minutes.",
    fields: [{ name: "email", label: "Email", type: "email", placeholder: "you@example.com" }],
    cta: { label: "Send reset link", variant: "primary" },
    back: { label: "Back to sign in", href: "/signin" },
    success: "Check maya.okafor@example.com for a link from help@wiseowl.app.",
  },

  "auth-verify": {
    headline: "Enter your verification code",
    sub: "We sent a 6-digit code to maya.okafor@example.com. It expires in 10 minutes, so enter it soon.",
    codeLength: 6,
    cta: { label: "Verify email", variant: "primary" },
    resend: { label: "Resend code", cooldown: "Resend available in 0:42" },
    help: "Wrong address? Change email",
  },

  "auth-magic-link": {
    headline: "Sign in without a password",
    sub: "We will email you a secure link that signs you in on this device. The link works once and expires in 15 minutes.",
    fields: [{ name: "email", label: "Email", type: "email", placeholder: "you@example.com" }],
    cta: { label: "Email me a link", variant: "primary" },
    secondaryCta: { label: "Use a password instead", variant: "secondary" },
    sent: { headline: "Check your inbox", body: "We sent a sign-in link to maya.okafor@example.com. You can close this tab." },
  },

  "auth-split-screen": {
    form: {
      headline: "Sign in to your household",
      sub: "Pick up where you left off. Your partner sees the same numbers the moment you update a budget.",
      fields: [
        { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
        { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
      ],
      cta: { label: "Sign in", variant: "primary" },
      secondaryCta: { label: "Email me a sign-in link", variant: "secondary" },
    },
    aside: {
      media: { alt: "Family kitchen table with a phone showing a savings goal at 64%" },
      quote: "Sunday money check-ins went from an hour of spreadsheets to fifteen minutes with coffee.",
      personId: "lena-hoffmann",
      name: "Lena Hoffmann",
      role: "Household owner · Denver, CO",
    },
  },

  "auth-sso-first": {
    headline: "Sign in to WiseOwl",
    sub: "Use the account you already trust. We never see your Google or Apple password, and you can add one later.",
    providers: [
      { id: "apple", label: "Continue with Apple" },
      { id: "google", label: "Continue with Google" },
    ],
    divider: "or use email",
    fields: [{ name: "email", label: "Email", type: "email", placeholder: "you@example.com" }],
    cta: { label: "Continue with email", variant: "secondary" },
    legal: "By continuing you agree to the Terms of Service and Privacy Policy.",
  },

  "sign-in-card": {
    title: "Sign in",
    description: "Use your WiseOwl email and password.",
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
      { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
    ],
    cta: { label: "Sign in", variant: "primary" },
    link: { label: "Forgot password?", href: "/forgot" },
  },

  "settings-panel": {
    title: "Preferences",
    sub: "Choose what WiseOwl tells you about and how the app looks on this device.",
    sections: [
      {
        title: "Notifications",
        items: [
          { id: "bills", label: "Bill reminders", description: "Two days before any bill or subscription is due.", type: "switch", value: true },
          { id: "budget", label: "Budget limits", description: "When a category reaches 80% and 100% of its limit.", type: "switch", value: true },
          { id: "large", label: "Large transactions", description: "Any single charge over the amount you set.", type: "switch", value: true, extra: { label: "Threshold", value: "$250.00" } },
          { id: "weekly", label: "Weekly summary", description: "A short recap every Sunday at 9:00 am.", type: "switch", value: false },
        ],
      },
      {
        title: "Appearance",
        items: [
          { id: "theme", label: "Theme", type: "select", value: "System", options: ["Light", "Dark", "System"] },
          { id: "density", label: "Table density", type: "select", value: "Comfortable", options: ["Comfortable", "Compact"] },
          { id: "hide", label: "Hide balances on open", description: "Blur amounts until you tap them.", type: "switch", value: false },
        ],
      },
    ],
    ctas: [
      { label: "Save changes", variant: "primary" },
      { label: "Reset", variant: "secondary" },
    ],
  },

  /* ================================ NAV =============================== */

  "nav-header-mega-menu": {
    brand: "WiseOwl",
    links: ["Product", "Household", "Pricing", "Developers", "Blog"],
    mega: {
      trigger: "Product",
      groups: [
        {
          title: "Plan",
          items: [
            { icon: "target", label: "Budgets", description: "Monthly limits by category" },
            { icon: "piggy-bank", label: "Savings goals", description: "Amounts and dates that add up" },
            { icon: "trending-up", label: "Cash-flow forecast", description: "The next 90 days, estimated" },
          ],
        },
        {
          title: "Track",
          items: [
            { icon: "landmark", label: "Accounts", description: "11,642 banks and credit unions" },
            { icon: "receipt", label: "Bills & subscriptions", description: "Every recurring charge in one list" },
            { icon: "line-chart", label: "Net worth", description: "Assets and debts over time" },
          ],
        },
        {
          title: "Ask",
          items: [
            { icon: "message-circle", label: "Ask WiseOwl", description: "Questions about your spending" },
            { icon: "scan-line", label: "Receipt scanning", description: "Line items from a photo" },
          ],
        },
      ],
      featured: {
        overline: "New in 3.8",
        title: "Shared goals for households",
        body: "Track one goal with contributions from everyone in the household.",
        cta: { label: "Read the release notes", href: "/changelog" },
        media: { alt: "Shared goal card showing contributions from two members" },
      },
    },
    ctas: [
      { label: "Sign in", variant: "secondary" },
      { label: "Start free", variant: "primary" },
    ],
  },

  "nav-sticky-appbar": {
    brand: "WiseOwl",
    breadcrumb: ["Okafor-Reyes Household", "Budgets", "September 2026"],
    search: { placeholder: "Search transactions, merchants or categories", shortcut: "⌘K" },
    actions: [
      { icon: "bell", label: "Notifications", badge: 3 },
      { icon: "plus", label: "Add transaction" },
    ],
    user: { personId: "maya-okafor", name: "Maya Okafor" },
  },

  "sidebar-standard": {
    brand: "WiseOwl",
    sections: [
      {
        items: [
          { icon: "layout-dashboard", label: "Overview", active: true },
          { icon: "landmark", label: "Accounts", count: 7 },
          { icon: "arrow-left-right", label: "Transactions", count: 12 },
          { icon: "target", label: "Budgets" },
          { icon: "piggy-bank", label: "Goals" },
          { icon: "receipt", label: "Bills" },
        ],
      },
      {
        title: "Insights",
        items: [
          { icon: "line-chart", label: "Net worth" },
          { icon: "trending-up", label: "Forecast" },
          { icon: "message-circle", label: "Ask WiseOwl" },
        ],
      },
    ],
    footer: [
      { icon: "settings", label: "Settings" },
      { icon: "life-buoy", label: "Help" },
    ],
    user: { personId: "maya-okafor", name: "Maya Okafor", email: "maya.okafor@example.com" },
  },

  "sidebar-workspace": {
    switcher: {
      current: { name: "Okafor-Reyes Household", plan: "Household", members: 4 },
      options: [
        { name: "Okafor-Reyes Household", plan: "Household" },
        { name: "Okafor Parents (viewer)", plan: "Household" },
        { name: "Maya · Freelance", plan: "Plus" },
      ],
      action: "Create household",
    },
    items: [
      { icon: "layout-dashboard", label: "Overview", active: true },
      { icon: "landmark", label: "Accounts" },
      { icon: "arrow-left-right", label: "Transactions" },
      { icon: "target", label: "Budgets" },
      { icon: "piggy-bank", label: "Goals" },
      { icon: "users", label: "Members" },
    ],
    usage: {
      title: "Household plan",
      meters: [
        { label: "Receipt scans", used: 118, limit: 150 },
        { label: "AI questions", used: 163, limit: 200 },
      ],
      note: "Resets Oct 14",
      cta: { label: "Manage plan" },
    },
  },

  "sidebar-collapsible": {
    brand: "WiseOwl",
    collapsedLabel: "Expand sidebar",
    expandedLabel: "Collapse sidebar",
    items: [
      { icon: "layout-dashboard", label: "Overview", active: true },
      { icon: "landmark", label: "Accounts" },
      { icon: "arrow-left-right", label: "Transactions" },
      { icon: "target", label: "Budgets" },
      { icon: "piggy-bank", label: "Goals" },
      { icon: "receipt", label: "Bills" },
      { icon: "settings", label: "Settings" },
    ],
  },

  "sidebar-inspector": {
    title: "Transaction details",
    merchant: { name: "Trader Joe's #142", logoInitials: "TJ" },
    amount: "-$86.47",
    status: "Posted",
    fields: [
      { label: "Date", value: "Oct 2, 2026" },
      { label: "Account", value: "Cascade Federal Checking ••6021" },
      { label: "Category", value: "Groceries", editable: true },
      { label: "Paid by", value: "Daniel Reyes" },
      { label: "Location", value: "Portland, OR" },
      { label: "Budget impact", value: "$612.40 of $750.00 used" },
      { label: "Receipt", value: "Scanned · 14 items" },
      { label: "Notes", value: "Includes school snacks for the week", editable: true },
      { label: "Transaction ID", value: "txn_8Hq2kV41mZ" },
    ],
    actions: [
      { label: "Split transaction", variant: "secondary" },
      { label: "Save changes", variant: "primary" },
    ],
  },

  "sidebar-dual-resizable": {
    rail: [
      { icon: "layout-dashboard", label: "Overview" },
      { icon: "landmark", label: "Accounts", active: true },
      { icon: "target", label: "Budgets" },
      { icon: "piggy-bank", label: "Goals" },
      { icon: "settings", label: "Settings" },
    ],
    list: {
      title: "Accounts",
      search: "Filter accounts",
      groups: [
        {
          title: "Cash",
          items: [
            { name: "Cascade Federal Checking", mask: "••6021", balance: "$4,812.36" },
            { name: "Harborline High-Yield Savings", mask: "••3390", balance: "$11,460.00" },
          ],
        },
        {
          title: "Credit",
          items: [
            { name: "Meridian Rewards Visa", mask: "••4417", balance: "-$1,236.18" },
            { name: "Pinecrest Cash Back", mask: "••8805", balance: "-$342.09" },
          ],
        },
        {
          title: "Loans and investments",
          items: [
            { name: "Harborline Auto Loan", mask: "••2274", balance: "-$6,918.40" },
            { name: "Northgate 401(k)", mask: "••1150", balance: "$98,540.83" },
            { name: "Home equity (manual)", mask: "", balance: "$77,960.00" },
          ],
        },
      ],
      total: { label: "Net worth", value: "$184,276.52" },
    },
  },

  "sidebar-floating": {
    brand: "WiseOwl",
    items: [
      { icon: "layout-dashboard", label: "Overview", active: true },
      { icon: "arrow-left-right", label: "Transactions" },
      { icon: "target", label: "Budgets" },
      { icon: "piggy-bank", label: "Goals" },
      { icon: "message-circle", label: "Ask WiseOwl" },
    ],
    card: {
      title: "Bills due this week",
      body: "3 bills totalling $1,418.72 before Friday.",
      cta: { label: "Review bills" },
    },
  },

  /* ============================== CONTENT ============================ */

  "faq-accordion-section": {
    overline: "FAQ",
    headline: "Questions people ask before joining",
    sub: "Still unsure? Write to help@wiseowl.app and a person replies within one business day.",
    items: [
      { q: "Can WiseOwl move money from my accounts?", a: "No. Connections are read-only, so WiseOwl can see balances and transactions but cannot move, send or withdraw money." },
      { q: "How do you keep my data secure?", a: "Data is encrypted with AES-256 at rest and TLS 1.3 in transit. Two-factor sign-in is available on every plan." },
      { q: "Which banks are supported?", a: "WiseOwl connects with 11,642 banks and credit unions in the US and Canada. You can add manual accounts for anything else." },
      { q: "Do you sell my data?", a: "Never. We make money from subscriptions only, and we do not show ads or share your data with lenders." },
      { q: "How does household sharing work?", a: "The Owner invites up to five people and gives each one Viewer, Editor or Owner access. You can remove anyone at any time." },
      { q: "What happens when my free trial ends?", a: "We email you three days before. If you do nothing, your account moves to the Free plan and keeps your data." },
      { q: "Can my accountant see my finances?", a: "Yes. Invite them as a Viewer to give read-only access, or use the Advisor plan if they manage several households." },
      { q: "How do I delete my account?", a: "Go to Settings, then Account, then Delete account. We erase your data within 30 days and send a confirmation email." },
    ],
  },

  "chat-ui": {
    title: "Support",
    agent: { personId: "noor-patel", name: "Noor Patel", role: "WiseOwl support", status: "Online · replies in about 3 min" },
    user: { personId: "daniel-reyes", name: "Daniel Reyes" },
    messages: [
      { from: "user", time: "9:41 am", text: "Hi, I moved $1,200.00 from checking to savings on Thursday and it still shows as pending. Is something wrong?" },
      { from: "agent", time: "9:43 am", text: "Hi Daniel, thanks for checking. I can see the transfer from Cascade Federal Checking ••6021 to Harborline Savings ••3390 dated Oct 1." },
      { from: "agent", time: "9:44 am", text: "Transfers between two different banks usually take 2–3 business days. Harborline posts incoming transfers overnight, so it should clear by Monday, Oct 5." },
      { from: "user", time: "9:46 am", text: "Got it. Will my savings goal update on its own once it clears?" },
      { from: "agent", time: "9:47 am", text: "Yes. Once it posts, the Emergency fund goal moves from $11,460.00 to $12,660.00 automatically. I set a reminder to check on Monday as well." },
    ],
    composer: { placeholder: "Write a message…", attach: "Attach screenshot", send: "Send" },
  },

  /* ============================= DASHBOARD =========================== */

  "app-shell": {
    nav: { brand: "WiseOwl", household: "Okafor-Reyes Household", items: ["Overview", "Accounts", "Transactions", "Budgets", "Goals", "Bills"], active: "Overview" },
    header: { title: "Good morning, Maya", sub: "Sunday, October 4 · 3 bills due this week" },
    kpis: [
      { label: "Net worth", value: "$184,276.52", change: "+2.4%" },
      { label: "Spent in September", value: "$6,412.38", change: "-6.8%" },
      { label: "Saved in September", value: "$3,427.62", change: "35% of income" },
      { label: "Bills due in 7 days", value: "$1,418.72", change: "3 bills" },
    ],
    table: {
      title: "Recent transactions",
      columns: ["Date", "Merchant", "Category", "Account", "Amount"],
      rows: [
        { date: "Oct 3", merchant: "Shell #4410", category: "Transport", account: "Meridian Visa ••4417", amount: "-$52.18" },
        { date: "Oct 2", merchant: "Trader Joe's #142", category: "Groceries", account: "Cascade Checking ••6021", amount: "-$86.47" },
        { date: "Oct 1", merchant: "Transfer to Savings", category: "Transfer", account: "Cascade Checking ••6021", amount: "-$1,200.00", status: "Pending" },
        { date: "Oct 1", merchant: "Riverside Apartments", category: "Rent", account: "Cascade Checking ••6021", amount: "-$2,150.00" },
        { date: "Sep 30", merchant: "Pacific Power", category: "Utilities", account: "Cascade Checking ••6021", amount: "-$118.63" },
        { date: "Sep 28", merchant: "Portland Public Schools", category: "Income", account: "Cascade Checking ••6021", amount: "+$4,920.00" },
      ],
      cta: { label: "View all transactions" },
    },
  },

  "card-user-profile": {
    personId: "maya-okafor",
    name: "Maya Okafor",
    email: "maya.okafor@example.com",
    role: "Household owner",
    household: "Okafor-Reyes Household",
    memberSince: "Member since March 2023",
    stats: [
      { label: "Linked accounts", value: "7" },
      { label: "Active goals", value: "5" },
      { label: "Streak", value: "31 weeks" },
    ],
    ctas: [
      { label: "Edit profile", variant: "secondary" },
      { label: "Manage household", variant: "primary" },
    ],
  },

  "onboarding-checklist": {
    title: "Finish setting up",
    sub: "Two of three done. Households who finish setup save about twice as much in their first month.",
    progress: { done: 2, total: 3, percent: 67 },
    tasks: [
      { id: "link", title: "Link your first bank", description: "3 accounts connected", done: true },
      { id: "budget", title: "Review your budget", description: "9 categories, $5,980.00 per month", done: true },
      { id: "invite", title: "Invite Daniel to the household", description: "Share budgets and goals with Editor access", done: false, cta: { label: "Send invite" } },
    ],
    dismiss: "Hide checklist",
  },

};

export const COPY_SLUGS = Object.keys(COPY);
