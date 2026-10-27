"use client";

import Link from "next/link";
import { useState } from "react";
import { navLinks, pages, siteConfig } from "@/lib/content";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sage-200/60 bg-sage-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group" onClick={() => setOpen(false)}>
          <span className="font-display text-xl tracking-tight text-sage-900 sm:text-2xl">
            {siteConfig.name}
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-widest text-sage-500">
            {pages.header.brandSubtitle}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-sage-700 transition-colors hover:text-cedar-600"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-full bg-sage-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-700"
          >
            {pages.header.bookNow}
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sage-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="border-t border-sage-200 bg-sage-50 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-sage-800 hover:bg-sage-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="mt-2 rounded-full bg-sage-800 px-5 py-3 text-center text-base font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {pages.header.bookNow}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-sage-200 bg-sage-900 text-sage-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display text-xl text-white">{siteConfig.name}</p>
            <p className="mt-2 text-sm">{siteConfig.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed">{pages.footer.blurb}</p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sage-400">
              {pages.footer.exploreHeading}
            </p>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sage-400">
              {pages.footer.bookHeading}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={siteConfig.bookUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                  {pages.footer.directBooking}
                </a>
              </li>
              <li>
                <a href={siteConfig.airbnbUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                  {pages.footer.airbnb}
                </a>
              </li>
              <li>
                <a href={siteConfig.vrboUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                  {pages.footer.vrbo}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.host.email}`} className="hover:text-white">
                  {siteConfig.host.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-sage-800 pt-8 text-center text-sm text-sage-500">
          © {new Date().getFullYear()} {siteConfig.domain} · {pages.footer.hostedBy} {siteConfig.host.name}
        </div>
      </div>
    </footer>
  );
}
