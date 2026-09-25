import Link from "next/link";
import { ArrowLeft, LibraryBig } from "lucide-react";
import { LibraryClient } from "@/components/library-client";
import { getSourceCatalog, listBuilds } from "@/lib/db";

export const metadata = { title: "Artifact library" };

export default async function LibraryPage() {
  const builds = await listBuilds("public-seed");
  const sources = getSourceCatalog();
  return <div className="page-wrap"><Link className="text-button" href="/"><ArrowLeft size={14} /> Back to the lab</Link><div className="section-heading" style={{ marginTop: 35 }}><div><span className="micro-label">Library / 02</span><h1>Artifacts with<br />their receipts.</h1></div><p>Browse the seeded public shelf or search your current anonymous scope. Every card opens to a real preview and a revision surface.</p></div><LibraryClient builds={builds} sources={sources} /><div className="footer-callout"><LibraryBig size={22} /><div><strong>Looking for a starting point?</strong><p>Use the composer to turn a new prompt into a sealed, shareable build.</p></div><Link className="primary-button" href="/build">Build one</Link></div></div>;
}
