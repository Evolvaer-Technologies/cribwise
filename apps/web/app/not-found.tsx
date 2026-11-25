import Link from "next/link";

export default function NotFound() {
  return (
    <section className="content">
      <h1>Page unavailable</h1>
      <p>Check the link or return to Cribwise.</p>
      <Link className="button" href="/">Back to home</Link>
    </section>
  );
}
