"use client";

import * as React from "react";
import { ExternalLink, Mail, Send } from "lucide-react";

const WHATSAPP_RAW = "212680696199";
const INSTAGRAM_URL = "https://www.instagram.com/abdellahps/";
const EMAIL_ADDRESS = "khoudenak@gmail.com";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(
  "Hi Abdellah! I would like to create a new tournament on FPL Tournaments. Can you help me set it up?"
)}`;

const EMAIL_URL = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
  "New Tournament Creation Request — FPL Tournaments"
)}&body=${encodeURIComponent(
  "Hi Abdellah!\n\nI would like to create a new tournament on FPL Tournaments:\n• Tournament Name:\n• FPL League Code/Link:\n• Desired Format:\n• Starting Gameweek:\n\nThanks!"
)}`;

export function ContactCardsClient() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
      {/* CARD 1: WhatsApp */}
      <div className="group relative rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#25D366] p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs">
        {/* Top highlight bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#25D366] to-[#00FFA3]" />

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8FBF0] text-[#25D366] border border-[#25D366]/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-.01 0-.01 0 0 0-1.44 0-2.86-.38-4.11-1.1l-.29-.17-3.11.82.83-3.03-.19-.3A8.2 8.2 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24m4.52 10.23c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.47-.29" />
              </svg>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FBF0] border border-[#25D366]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#128C7E]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#25D366]" />
              </span>
              Fastest Response
            </span>
          </div>

          <h3 className="text-lg font-black text-[#0B081E] tracking-tight">WhatsApp</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
            Instant chat with the admin to get your tournament configured and live right away.
          </p>
        </div>

        <div className="mt-5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm tracking-tight transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
          >
            <span>Chat on WhatsApp</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* CARD 2: Instagram */}
      <div className="group relative rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#DD2A7B] p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs">
        {/* Top highlight bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]" />

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDF0F5] text-[#DD2A7B] border border-[#DD2A7B]/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF0F5] border border-[#DD2A7B]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#DD2A7B]">
              DM
            </span>
          </div>

          <h3 className="text-lg font-black text-[#0B081E] tracking-tight">Instagram</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
            Send a direct message on Instagram with your league name and format details.
          </p>
        </div>

        <div className="mt-5">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:brightness-105 text-white font-black text-sm tracking-tight transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
          >
            <span>Send DM on Instagram</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* CARD 3: Email */}
      <div className="group relative rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#1689E8] p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md shadow-xs">
        {/* Top highlight bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#1689E8] to-[#00FFA3]" />

        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1689E8] border border-[#1689E8]/20 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#1689E8]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#1689E8]">
              Email
            </span>
          </div>

          <h3 className="text-lg font-black text-[#0B081E] tracking-tight">Email</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
            Send us an email with your FPL league details, custom rules, or inquiries.
          </p>
        </div>

        <div className="mt-5">
          <a
            href={EMAIL_URL}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#0B081E] hover:bg-[#240027] text-white font-black text-sm tracking-tight transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer"
          >
            <span>Send Email to Admin</span>
            <Send className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
