"use client"

import { type HTMLAttributes, useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Decorative hero illustration used on marketing surfaces.
 */
export function HeroIllustration({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const beamGradientId = useId()
  const deviceStrokeId = useId()

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-[36px] border border-border bg-gradient-to-br from-orange-700 via-amber-500 to-amber-200",
        className
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 420 520"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={beamGradientId} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={deviceStrokeId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d="M208 200C260 184 290 160 331 138"
          fill="none"
          stroke={`url(#${beamGradientId})`}
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          d="M200 230C162 256 122 296 94 336"
          fill="none"
          stroke={`url(#${beamGradientId})`}
          strokeDasharray="14 14"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <path
          d="M218 255C246 300 276 332 312 348"
          fill="none"
          stroke={`url(#${beamGradientId})`}
          strokeDasharray="10 18"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <g transform="translate(150 110)">
          <rect
            fill="#020617"
            height="260"
            rx="28"
            stroke={`url(#${deviceStrokeId})`}
            strokeWidth="3"
            width="140"
          />
          <rect fill="#0b1120" height="216" rx="22" width="120" x="10" y="16" />
          <rect fill="#0f172a" height="6" rx="3" width="44" x="48" y="30" />
          <g transform="translate(24 60)">
            <rect
              fill="#1f2937"
              height="32"
              rx="10"
              width="92"
              opacity="0.85"
            />
            <rect fill="#38bdf8" height="4" rx="2" width="58" x="12" y="12" />
            <rect fill="#f97316" height="4" rx="2" width="36" x="12" y="20" />
            <rect fill="#d946ef" height="4" rx="2" width="24" x="12" y="28" />
          </g>
          <g transform="translate(24 110)">
            <rect fill="#1f2937" height="72" rx="12" width="92" opacity="0.8" />
            <rect fill="#22c55e" height="8" rx="4" width="68" x="12" y="16" />
            <rect fill="#f59e0b" height="6" rx="3" width="44" x="12" y="32" />
            <rect fill="#38bdf8" height="6" rx="3" width="56" x="12" y="46" />
            <rect fill="#d946ef" height="6" rx="3" width="24" x="12" y="60" />
          </g>
          <g transform="translate(24 196)">
            <rect
              fill="#1f2937"
              height="32"
              opacity="0.75"
              rx="10"
              width="92"
            />
            <rect fill="#38bdf8" height="6" rx="3" width="54" x="12" y="10" />
            <rect fill="#22c55e" height="4" rx="2" width="36" x="12" y="20" />
            <rect fill="#f97316" height="4" rx="2" width="26" x="12" y="26" />
          </g>
        </g>
        <g transform="translate(288 86)">
          <rect
            fill="#020817"
            height="108"
            rx="24"
            stroke={`url(#${deviceStrokeId})`}
            strokeWidth="3"
            width="82"
          />
          <rect fill="#0b1120" height="80" rx="18" width="58" x="12" y="14" />
          <circle cx="41" cy="54" fill="#020817" r="20" />
          <circle
            cx="41"
            cy="54"
            fill="none"
            r="16"
            stroke="#38bdf8"
            strokeDasharray="14 6"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M41 54L41 36"
            stroke="#f97316"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="41" cy="54" fill="#22c55e" r="6" />
          <rect fill="#38bdf8" height="8" rx="4" width="28" x="26" y="88" />
        </g>
        <g transform="translate(58 312)">
          <rect
            fill="#020617"
            height="132"
            rx="24"
            stroke={`url(#${deviceStrokeId})`}
            strokeWidth="3"
            width="212"
            x="4"
            y="0"
          />
          <rect fill="#0b1120" height="84" rx="16" width="180" x="20" y="18" />
          <rect fill="#1f2937" height="12" rx="6" width="120" x="50" y="38" />
          <rect fill="#38bdf8" height="10" rx="5" width="104" x="50" y="60" />
          <g transform="translate(32 100)">
            <rect fill="#0f172a" height="24" rx="6" width="52" opacity="0.85" />
            <rect fill="#22c55e" height="6" rx="3" width="38" x="7" y="9" />
          </g>
          <g transform="translate(102 100)">
            <rect fill="#0f172a" height="24" rx="6" width="52" opacity="0.85" />
            <rect fill="#f97316" height="6" rx="3" width="38" x="7" y="9" />
          </g>
          <g transform="translate(172 100)">
            <rect fill="#0f172a" height="24" rx="6" width="52" opacity="0.85" />
            <rect fill="#38bdf8" height="6" rx="3" width="38" x="7" y="9" />
          </g>
          <rect
            fill="#0b1120"
            height="8"
            rx="4"
            width="224"
            x="0"
            y="140"
            opacity="0.75"
          />
        </g>
      </svg>
    </div>
  )
}
