import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odečty energií",
  description: "Evidence odečtů energií a výpočet spotřeby a cen.",
};

const NAV = [
  { href: "/", label: "Přehled" },
  { href: "/readings", label: "Odečty" },
  { href: "/meters", label: "Měřiče" },
  { href: "/tariffs", label: "Sazby" },
  { href: "/reports", label: "Souhrny" },
];

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-rule bg-night-deep/60 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-6 py-3.5 flex items-center gap-8 flex-wrap">
            <Link
              href="/"
              className="display flex items-center gap-2.5 whitespace-nowrap text-ink hover:text-ink-soft transition-colors"
              style={{ fontSize: "1.05rem" }}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: "var(--color-brand)" }}
                aria-hidden="true"
              />
              <span>Odečty energií</span>
            </Link>
            <nav className="flex gap-5 flex-wrap items-baseline ml-auto">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
          {children}
        </main>
        {modal}

        <footer className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-ink-faint">
              Lokální evidence
            </p>
            <p className="text-xs text-ink-faint">
              data v <code className="text-ink-muted">prisma/dev.db</code>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
