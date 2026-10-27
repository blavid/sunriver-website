/**
 * Strip build artifacts so prerendered HTML can be compared across compiles.
 * Visible markup, copy, class names, and image paths stay. Chunk hashes,
 * font-module hashes, favicon queries, React text markers, and the footer year do not.
 */
export function normalizeHtml(html) {
  let s = html;
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<link\b[^>]*>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/[a-z0-9_]+-module__[a-zA-Z0-9]+__/g, "module__");
  s = s.replace(/favicon\.ico\?[^"'\s>]*/g, "favicon.ico");
  s = s.replace(/©\s*\d{4}/g, "© YEAR");
  return s;
}

export const ROUTES = [
  ["index.html", "home.html"],
  ["the-home.html", "the-home.html"],
  ["guest-guide.html", "guest-guide.html"],
  ["activities.html", "activities.html"],
  ["book.html", "book.html"],
  ["explore.html", "explore.html"],
  ["_not-found.html", "not-found.html"],
];
