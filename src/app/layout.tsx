import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Footer, Header } from "@/components/HeaderFooter";
import { pages } from "@/lib/content";
import "./globals.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const openGraphType = pages.metadata.openGraph.type;
if (openGraphType !== "website") {
  throw new Error('pages.json openGraph.type must be "website"');
}

export const metadata: Metadata = {
  title: {
    default: pages.metadata.title.default,
    template: pages.metadata.title.template,
  },
  description: pages.metadata.description,
  keywords: pages.metadata.keywords,
  openGraph: {
    title: pages.metadata.openGraph.title,
    description: pages.metadata.openGraph.description,
    url: pages.metadata.openGraph.url,
    siteName: pages.metadata.openGraph.siteName,
    locale: pages.metadata.openGraph.locale,
    type: openGraphType,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
