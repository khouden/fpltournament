import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { FplLogo } from "@/components/brand/fpl-logo";

export function Footer() {
  return (
    <footer className="w-full bg-[#0B081E] text-white border-t border-white/[0.08] mt-auto">
      <Container className="py-12 lg:py-16">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-10 border-b border-white/[0.08]">
          {/* Logo */}
          <div className="flex items-center">
            <FplLogo size="md" />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-8 text-sm font-semibold text-[#A69DC6]" aria-label="Footer Navigation">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/tournaments" className="hover:text-white transition-colors">
              Tournaments
            </Link>
            <Link href="/create-tournament" className="hover:text-white transition-colors">
              Create Tournament
            </Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">
              How it works
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-[#A69DC6]">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/abdellahps/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:text-[#00FFA3] hover:bg-white/[0.05] transition-all"
              aria-label="Instagram"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/212680696199"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:text-[#00FFA3] hover:bg-white/[0.05] transition-all"
              aria-label="WhatsApp"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-.01 0-.01 0 0 0-1.44 0-2.86-.38-4.11-1.1l-.29-.17-3.11.82.83-3.03-.19-.3A8.2 8.2 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24m4.52 10.23c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.47-.29" />
              </svg>
            </a>

            {/* Email */}
            <a
              href="mailto:khoudenak@gmail.com"
              className="p-2 rounded-full hover:text-[#00FFA3] hover:bg-white/[0.05] transition-all"
              aria-label="Email"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A69DC6]/80 font-medium">
          <p>© 2026 FPL Tournaments. All rights reserved.</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-white">
            <span>More than a</span>
            <span className="relative">
              game.
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#00FFA3]" />
            </span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
