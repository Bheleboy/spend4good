import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Spend4Good",
  applicationCategory: "FinanceApplication",
  applicationSubCategory: "Nonprofit Compliance and Spend Tracking",
  operatingSystem: "Web",
  url: "https://spend4good.com",
  description:
    "Spend4Good is South Africa's only nonprofit spend tracking and compliance management platform. Built specifically for DSD narrative report generation, CIPC beneficial ownership filing tracking, Section 18A certificate management, POPIA compliance, and WhatsApp-based field expense submissions. Used by South African nonprofits and their corporate CSI funders.",
  keywords:
    "nonprofit compliance South Africa, DSD report generator, CIPC NPO compliance, Section 18A tracking, POPIA nonprofit, NPO spend tracking, CSI grantee management, nonprofit WhatsApp expenses, South Africa NPO software, corporate social investment platform, B-BBEE CSI spend tracking, nonprofit funder portal South Africa",
  featureList: [
    "AI-generated DSD narrative reports",
    "CIPC beneficial ownership deadline tracking",
    "Section 18A certificate management",
    "POPIA compliance calendar",
    "WhatsApp expense submission for field workers",
    "Funder portfolio dashboard",
    "NPO compliance health score",
    "Document vault with AI gap checker",
    "Expense approval workflow",
    "Project and field agent tracking",
    "B-BBEE CSI spend reporting",
  ],
  audience: {
    "@type": "Audience",
    audienceType:
      "Nonprofit Organizations, Corporate CSI Departments, Foundations, Social Impact Funders",
    geographicArea: { "@type": "Country", name: "South Africa" },
  },
  offers: [
    {
      "@type": "Offer",
      name: "Nonprofit Starter",
      price: "149.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1Y",
        billingIncrement: 1,
      },
      eligibleCustomerType: "Nonprofit Organization",
      description:
        "Annual plan for South African registered nonprofits. Includes DSD compliance reporting, CIPC tracking, WhatsApp expense submissions, and document vault.",
    },
    {
      "@type": "Offer",
      name: "Funder Starter",
      price: "999.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1Y",
        billingIncrement: 1,
      },
      eligibleCustomerType: "Corporation, Foundation",
      description:
        "Annual funder plan for corporate CSI departments and foundations. Manage up to 10 grantee nonprofits. Grantees access the platform free. Real-time spend visibility and compliance status for your entire portfolio.",
    },
    {
      "@type": "Offer",
      name: "Funder Growth",
      price: "1999.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1Y",
        billingIncrement: 1,
      },
      eligibleCustomerType: "Corporation, Foundation",
      description:
        "Annual funder plan for up to 30 grantee nonprofits. Advanced reporting and exports for B-BBEE CSI compliance documentation.",
    },
    {
      "@type": "Offer",
      name: "Funder Unlimited",
      price: "3499.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1Y",
        billingIncrement: 1,
      },
      eligibleCustomerType: "Corporation, Foundation, GovernmentOrganization",
      description:
        "Unlimited grantee portfolios for large foundations and DFIs. Full spend tracking, compliance monitoring, and reporting across all funded nonprofits.",
    },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Spend4Good",
  legalName: "Private Clients Advisory",
  url: "https://spend4good.com",
  logo: "https://spend4good.com/logo.png",
  email: "hello@spend4good.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Durban",
    addressRegion: "KwaZulu-Natal",
    addressCountry: "ZA",
  },
  areaServed: { "@type": "Country", name: "South Africa" },
  knowsAbout: [
    "South African NPO compliance",
    "Department of Social Development reporting",
    "CIPC beneficial ownership",
    "Section 18A tax certificates",
    "POPIA compliance",
    "Corporate Social Investment",
    "B-BBEE CSI spend",
    "Nonprofit spend tracking",
    "Funder grantee management",
  ],
  sameAs: ["https://spend4good.com"],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Nonprofit Compliance and Spend Management Platform",
  name: "Spend4Good",
  provider: { "@type": "Organization", name: "Private Clients Advisory" },
  areaServed: { "@type": "Country", name: "South Africa" },
  audience: {
    "@type": "Audience",
    audienceType:
      "South African nonprofits, corporate CSI departments, foundations, social impact investors, B-BBEE compliance officers",
  },
  description:
    "Spend4Good helps South African nonprofits stay DSD-compliant, track spend, and build funder trust. Corporate CSI departments use Spend4Good to manage their grantee portfolios, verify nonprofit compliance status, and document B-BBEE CSI spend in real time. Nonprofits invited by a funder access the platform free.",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Spend4Good Plans",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Grantee Compliance Monitoring",
          description:
            "Real-time compliance status for every nonprofit in your CSI portfolio. DSD filing deadlines, CIPC status, Section 18A expiry, POPIA review dates — all tracked automatically.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "WhatsApp Expense Submission",
          description:
            "Field workers submit receipts via WhatsApp. No app download required. Expenses are automatically matched to projects and field agents for audit-ready reporting.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI DSD Report Generation",
          description:
            "AI-assisted narrative report generation for Department of Social Development submission. Structured input form produces a compliant draft report ready for review and manual submission.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "CSI Portfolio Dashboard",
          description:
            "Corporate CSI managers see all funded nonprofits in one dashboard with real spend data, compliance health scores, and expense approval workflows. Supports B-BBEE CSI spend documentation.",
        },
      },
    ],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Spend4Good?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Spend4Good is South Africa's only nonprofit spend tracking and compliance management platform. It helps SA-registered nonprofits stay DSD-compliant, track field expenses via WhatsApp, and build funder trust. Corporate CSI departments use it to manage their grantee portfolios and document B-BBEE CSI spend.",
      },
    },
    {
      "@type": "Question",
      name: "How does Spend4Good help with DSD compliance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Spend4Good tracks all South African NPO compliance deadlines including DSD narrative report submissions (due 9 months after financial year end), CIPC beneficial ownership filings, Section 18A certificate renewals, and POPIA annual reviews. It also generates AI-assisted DSD narrative report drafts ready for submission.",
      },
    },
    {
      "@type": "Question",
      name: "Can corporate CSI departments use Spend4Good to manage their funded nonprofits?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Spend4Good's funder plans are built specifically for corporate CSI departments, foundations, and social impact investors. Funders invite their grantee nonprofits to the platform — grantees access it free. Funders see real-time spend data, compliance status, and expense reports for their entire portfolio. This supports B-BBEE CSI spend documentation and grantee accountability.",
      },
    },
    {
      "@type": "Question",
      name: "How do nonprofits submit expenses on Spend4Good?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Field workers send a WhatsApp message with a photo of their receipt to the Spend4Good number. No app download is required. The system automatically matches the submission to the field agent, project, and organisation. Project managers and funders can approve or reject expenses from the dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Is Spend4Good only for South African nonprofits?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The compliance features (DSD, CIPC, Section 18A, POPIA) are built specifically for South African registered nonprofits. Spend tracking, WhatsApp expense submission, and funder portfolio management work for any organisation. International funders funding South African grantees are fully supported.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Spend4Good cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nonprofits pay $149/year (approximately R2,490/year). Funder plans start at $999/year for up to 10 grantee nonprofits, $1,999/year for up to 30, and $3,499/year for unlimited grantees. Nonprofits invited by a funder access the platform completely free.",
      },
    },
    {
      "@type": "Question",
      name: "What is a CSI compliance platform?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A CSI compliance platform helps corporate Social Investment departments manage their grantee nonprofits, verify their compliance with South African regulations, track spend against CSI budgets, and generate documentation for B-BBEE scorecard submissions. Spend4Good is South Africa's dedicated platform for this purpose.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find verified nonprofits for my CSI budget in South Africa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Spend4Good provides a compliance health score for every registered nonprofit on the platform. Corporate CSI managers can invite nonprofits to Spend4Good to verify their DSD registration, compliance status, and financial transparency before and during funding. This gives CSI departments documented evidence of due diligence for B-BBEE purposes.",
      },
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Spend4Good",
  url: "https://spend4good.com",
  description:
    "South Africa's nonprofit compliance and spend tracking platform. Built for DSD, CIPC, Section 18A, POPIA, and WhatsApp field submissions.",
  inLanguage: "en-ZA",
  publisher: { "@type": "Organization", name: "Private Clients Advisory" },
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Spend4Good — South Africa's Nonprofit Compliance and Spend Platform" },
      { name: "description", content: "Track spend. Stay DSD-compliant. Build funder trust. The only platform built for South African nonprofits and their corporate CSI funders." },
      { name: "robots", content: "index, follow" },
      { name: "geo.region", content: "ZA" },
      { name: "geo.placename", content: "South Africa" },
      { name: "geo.position", content: "-29.8587;31.0218" },
      { name: "ICBM", content: "-29.8587, 31.0218" },
      { property: "og:title", content: "Spend4Good — South Africa's Nonprofit Compliance and Spend Platform" },
      { property: "og:description", content: "Track spend. Stay DSD-compliant. Build funder trust. The only platform built for South African nonprofits and their corporate CSI funders." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://spend4good.com" },
      { property: "og:locale", content: "en_ZA" },
      { property: "og:site_name", content: "Spend4Good" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Spend4Good — South Africa's Nonprofit Compliance Platform" },
      { name: "twitter:description", content: "DSD reports, CIPC tracking, WhatsApp expenses, funder dashboards. Built for SA nonprofits." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(softwareApplicationSchema) },
      { type: "application/ld+json", children: JSON.stringify(organizationSchema) },
      { type: "application/ld+json", children: JSON.stringify(serviceSchema) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema) },
      { type: "application/ld+json", children: JSON.stringify(websiteSchema) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
