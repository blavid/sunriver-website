import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Footer, Header } from "@/components/HeaderFooter";
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

export const metadata: Metadata = {
  title: {
    default: "Sunriver Townhome | Eaglewood Vacation Rental",
    template: "%s | Sunriver Townhome",
  },
  description:
    "Luxury 3-bedroom townhome on the Woodlands Golf Course in Sunriver, Oregon. Hot tub, SHARC passes, bikes, and smart home features. Book direct or explore our guest guide.",
  keywords: [
    "Sunriver vacation rental",
    "Eaglewood townhome",
    "Central Oregon",
    "SHARC passes",
    "Woodlands Golf Course",
  ],
  openGraph: {
    title: "Sunriver Townhome | Eaglewood Vacation Rental",
    description:
      "Newly remodeled 3-bedroom luxury townhome with hot tub, SHARC passes, and bikes in Sunriver, Oregon.",
    url: "https://sunrivertownhome.com",
    siteName: "Sunriver Townhome",
    locale: "en_US",
    type: "website",
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
