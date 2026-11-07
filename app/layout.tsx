import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AskBansiChat from "@/components/AskBansiChat";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#FF5757",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: {
    default: "Bansi Jethava | Computer Engineering Student",
    template: "%s | Bansi Jethava",
  },
  description:
    "Explore Bansi Jethava's learning journey in computer engineering, C programming, and her growing interest in web development.",
  keywords: [
    "Bansi Jethava",
    "Diploma Computer Engineering student",
    "AVPTI GTU College",
    "Rajkot, Gujarat",
    "C programming",
    "Web development learner",
    "Gujarat Technological University",
  ],
  authors: [{ name: "Bansi Jethava" }],
  creator: "Bansi Jethava",
  publisher: "Bansi Jethava",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Bansi Jethava | Computer Engineering Student",
    description:
      "Explore Bansi Jethava's learning journey in computer engineering, C programming, and her growing interest in web development.",
    siteName: "Bansi Jethava Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bansi Jethava | Computer Engineering Student",
    description:
      "Explore Bansi Jethava's learning journey in computer engineering, C programming, and her growing interest in web development.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Bansi Jethava",
    description:
      "Diploma Computer Engineering student at AVPTI GTU College, Rajkot, Gujarat. Proficient in C, Python, Data Structures & Algorithms, and SQL databases with a focus on web development.",
    affiliation: {
      "@type": "EducationalOrganization",
      name: "AVPTI GTU College, Rajkot",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Rajkot",
        addressRegion: "Gujarat",
        addressCountry: "India",
      },
    },
    sameAs: [
      "https://github.com/bansijethava",
      "https://www.linkedin.com/in/bansi-jethava-b529973a8/",
      "https://www.instagram.com/bansiijethava/"
    ],
    knowsAbout: [
      "C Programming",
      "Python Programming",
      "Data Structures & Algorithms (DSA in C)",
      "SQL & Relational Databases (RDBMS)",
      "Operating Systems",
      "Computer Engineering",
      "Web Development"
    ],
  };

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#080B12] text-[#111827] dark:text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#DCE6F2] dark:selection:bg-[#FF6B6B]/30 selection:text-[#243B65] dark:selection:text-white transition-colors duration-200">
        {/* WCAG Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-5 focus:py-2 focus:bg-[#111827] dark:focus:bg-white focus:text-white dark:focus:text-[#111827] focus:rounded-full focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#FF5757] text-xs font-semibold tracking-wide transition-all"
        >
          Skip to main content
        </a>
        {children}
        <AskBansiChat />
      </body>
    </html>
  );
}
