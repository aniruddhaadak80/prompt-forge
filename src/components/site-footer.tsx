import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><span className="brand-glyph">PF</span><span>{siteConfig.name}</span></div>
          <p>{siteConfig.description} Built for people who want to see the artifact, not just the prompt.</p>
        </div>
        <div>
          <span className="micro-label">Explore</span>
          <div className="footer-links">
            <Link href="/build">Build an artifact</Link>
            <Link href="/library">Browse the library</Link>
            <Link href="/method">Read the method</Link>
            <Link href="/agent">Open agent console</Link>
          </div>
        </div>
        <div>
          <span className="micro-label">Open source</span>
          <a className="footer-github" href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer"><GitBranch size={15} /> {siteConfig.repoUrl.replace("https://", "")} <ArrowUpRight size={13} /></a>
        </div>
      </div>
      <div className="footer-bottom"><span>MIT licensed · keyless core · public beta</span><span>Source, evidence, runtime.</span></div>
    </footer>
  );
}
