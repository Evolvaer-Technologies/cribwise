import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeSwitch } from "./theme-switch";
import "@evolvaer/design-tokens";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "Cribwise", template: "%s | Cribwise" },
  description: "Compare student homes side by side.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="shell masthead">
          <Link className="wordmark" href="/">Cribwise</Link>
          <nav aria-label="Main navigation">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/register">My areas</Link>
            <Link href="/saved">Saved</Link>
            <Link href="/my-comparisons">My comparisons</Link>
            <Link href="/groups">Groups</Link>
          </nav>
          <ThemeSwitch />
        </header>
        <main className="shell" id="main" tabIndex={-1}>{children}</main>
        <footer className="shell footer">Cribwise by Evolvaer</footer>
      </body>
    </html>
  );
}
