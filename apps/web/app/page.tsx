import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <p className="eyebrow">Student housing comparisons</p>
      <h1>Choose your next home with more confidence.</h1>
      <p>See rent, bills and contract details side by side so you can decide what matters most to you.</p>
      <div className="actions">
        <Link className="button" href="/c/demo">View a sample comparison</Link>
        <Link href="/how-it-works">See how it works</Link>
      </div>
    </section>
  );
}
