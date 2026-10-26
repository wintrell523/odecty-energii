import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odečty energií",
  description: "Evidence odečtů energií a výpočet spotřeby a cen.",
};

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
      className={`${bricolage.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full md:mx-auto md:grid md:max-w-[85rem] md:grid-cols-[13rem_1fr]">
        <aside className="md:sticky md:top-0 md:h-svh md:flex md:flex-col md:py-10 md:pl-5">
          <Link
            href="/"
            className="display hidden md:block px-3 pb-8 text-xl leading-tight text-ink"
          >
            Odečty
            <br />
            energií
          </Link>
          <Nav />
          <p className="hidden md:block mt-auto px-3 text-xs text-ink-faint">
            data v <code className="text-ink-muted">prisma/dev.db</code>
          </p>
        </aside>

        <main className="w-full max-w-6xl px-5 pt-8 pb-28 md:px-10 md:py-10">
          {children}
        </main>
        {modal}
      </body>
    </html>
  );
}
