"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import {
  Skeleton,
  TournamentCardSkeleton,
  StandingsTableSkeleton,
} from "@/components/ui/skeleton";
import { Trophy, Calendar, Users, Shield, Sparkles } from "lucide-react";

/**
 * Skeleton for the /tournaments catalog page
 */
export function TournamentsCatalogSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#1F1F1F] animate-fpl-fade-in">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden bg-[#0B081E] text-white py-14 sm:py-20 border-b border-white/[0.08]">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-[#00FFA3]/10 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-4">
            {/* Badge Shimmer */}
            <div className="h-7 w-48 rounded-full animate-shimmer-dark bg-white/10" />

            {/* Title Shimmer */}
            <div className="h-12 sm:h-16 w-3/4 max-w-xl rounded-2xl animate-shimmer-dark bg-white/10" />

            {/* Subtitle Shimmer */}
            <div className="h-5 w-2/3 max-w-md rounded-lg animate-shimmer-dark bg-white/10 mt-2" />

            {/* Quick stats pills shimmer */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <div className="h-9 w-32 rounded-full animate-shimmer-dark bg-white/10" />
              <div className="h-9 w-36 rounded-full animate-shimmer-dark bg-white/10" />
              <div className="h-9 w-28 rounded-full animate-shimmer-dark bg-white/10" />
            </div>
          </div>
        </Container>
      </section>

      {/* Main Catalog Content Skeleton */}
      <main className="flex-1">
        <Container>
          <div className="pt-8 sm:pt-10 pb-20">
            {/* Filter & Search Bar Row Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
              {/* Segmented Pill Tabs Skeleton */}
              <div className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white p-1 shadow-xs gap-1">
                <Skeleton className="h-8 w-36 rounded-full" />
                <Skeleton className="h-8 w-36 rounded-full" />
              </div>

              {/* Search Bar Skeleton */}
              <Skeleton className="h-10 w-full sm:w-72 rounded-full" />
            </div>

            {/* 6-Card Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <TournamentCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

/**
 * Skeleton for the /tournaments/[id] detail page
 */
export function TournamentDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F1F1F] animate-fpl-fade-in">
      <main className="flex-1 pb-20">
        {/* Cinematic Hero Header Skeleton */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#120422] via-[#20002E] to-[#120422] text-white pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-white/10">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#00FF87]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#00D9FF]/10 rounded-full blur-3xl pointer-events-none" />

          <Container className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left Column: Title & Info */}
              <div className="space-y-4 max-w-2xl">
                {/* Status Badges Row */}
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-24 rounded-full animate-shimmer-dark bg-white/10" />
                  <div className="h-6 w-20 rounded-full animate-shimmer-dark bg-white/10" />
                </div>

                {/* Tournament Name */}
                <div className="h-10 sm:h-12 w-4/5 rounded-xl animate-shimmer-dark bg-white/10" />

                {/* Subtitle / Description */}
                <div className="h-4 w-full max-w-lg rounded-md animate-shimmer-dark bg-white/10" />

                {/* Quick Info Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="h-7 w-28 rounded-lg animate-shimmer-dark bg-white/10" />
                  <div className="h-7 w-32 rounded-lg animate-shimmer-dark bg-white/10" />
                  <div className="h-7 w-24 rounded-lg animate-shimmer-dark bg-white/10" />
                </div>
              </div>

              {/* Right Column: Key Stats Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md min-w-[280px] space-y-4">
                <div className="h-4 w-28 rounded-md animate-shimmer-dark bg-white/10" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-14 rounded animate-shimmer-dark bg-white/10" />
                    <div className="h-6 w-16 rounded-md animate-shimmer-dark bg-white/10" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-14 rounded animate-shimmer-dark bg-white/10" />
                    <div className="h-6 w-16 rounded-md animate-shimmer-dark bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Sticky Tab Navigation Bar Skeleton */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8ECF2] shadow-xs py-3">
          <Container>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </Container>
        </div>

        {/* Content Section Skeleton */}
        <Container className="pt-8 space-y-8">
          {/* Round Performers MVP Banner Skeleton */}
          <div className="rounded-[20px] border border-[#E8ECF2] bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-60 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
          </div>

          {/* Standings Table Skeleton */}
          <StandingsTableSkeleton rows={8} />
        </Container>
      </main>
    </div>
  );
}

/**
 * Skeleton for the /admin dashboard
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* Command Center Hero Section Skeleton */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170020] via-[#240030] to-[#180022] text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="h-5 w-32 rounded-full animate-shimmer-dark bg-white/10" />
            <div className="h-9 sm:h-11 w-3/4 rounded-xl animate-shimmer-dark bg-white/10" />
            <div className="h-4 w-2/3 rounded-md animate-shimmer-dark bg-white/10" />
          </div>
          <div className="h-12 w-48 rounded-2xl animate-shimmer-dark bg-white/10 shrink-0" />
        </div>
      </section>

      {/* 4 Metric Cards Strip Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tournaments List Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-9 w-64 rounded-full" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E8ECF2] bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-16 w-24 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-72 rounded-md" />
                  <div className="flex items-center gap-4 pt-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
