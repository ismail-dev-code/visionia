"use client";

import { motion } from "framer-motion";
import { ArrowRight, BatteryCharging, Cable, ShieldCheck, Star } from "lucide-react";

export function HeroVisual() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(15,118,110,0.1),_transparent_35%)]" />

        <div className="relative rounded-[1.5rem] bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Top deal</p>
              <h3 className="mt-2 text-2xl font-semibold">Vision Pro Cable Pack</h3>
            </div>
            <div className="rounded-full bg-cyan-400/15 p-2 text-cyan-300">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300">
                    <Cable className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300">USB-C</div>
                    <div className="mt-1 text-lg font-semibold">Fast charge</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
                    <BatteryCharging className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Power Bank</div>
                    <div className="mt-1 text-lg font-semibold">20,000 mAh</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex h-36 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
              <div className="absolute inset-x-4 top-5 h-16 rounded-full bg-cyan-300/40 blur-2xl" />
              <div className="relative flex h-24 w-16 items-center justify-center rounded-[1.5rem] border border-cyan-300/30 bg-slate-900 shadow-[inset_0_0_20px_rgba(34,211,238,0.15)]">
                <div className="h-14 w-10 rounded-xl bg-gradient-to-b from-cyan-300/80 to-sky-500"> </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Trusted</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">2-year warranty</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-amber-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">4.9/5</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">12k happy buyers</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
