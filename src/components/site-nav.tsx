"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, GitBranch, Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link className="brand-mark" href="/" aria-label={`${siteConfig.name} home`}>
          <span className="brand-glyph">PF</span>
          <span>
            <strong>{siteConfig.name}</strong>
            <small>artifact lab</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {siteConfig.nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <a className="nav-github" href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer">
          <GitBranch size={15} aria-hidden="true" /> View source <ArrowUpRight size={13} aria-hidden="true" />
        </a>
        <button className="menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? <nav className="mobile-nav" aria-label="Mobile navigation">
        {siteConfig.nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
        <a href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>GitHub source <ArrowUpRight size={14} /></a>
      </nav> : null}
    </header>
  );
}
