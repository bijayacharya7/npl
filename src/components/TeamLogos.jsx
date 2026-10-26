import React from 'react'

/**
 * Authentic vector crests and emblems for all 8 Nepal Premier League franchises.
 * Designed with franchise primary & accent colors, mascots, and iconography.
 */

export function BiratnagarKingsLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Biratnagar Kings Logo"
    >
      <defs>
        <linearGradient id="bk-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1b2a6b" />
          <stop offset="100%" stopColor="#0a1236" />
        </linearGradient>
        <linearGradient id="bk-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="50%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#c69214" />
        </linearGradient>
      </defs>
      {/* Shield Base */}
      <path
        d="M50 5 L88 20 C88 58 72 82 50 95 C28 82 12 58 12 20 Z"
        fill="url(#bk-grad)"
        stroke="url(#bk-gold)"
        strokeWidth="3.5"
      />
      {/* Inner Accent Line */}
      <path
        d="M50 11 L82 24 C82 54 68 76 50 88 C32 76 18 54 18 24 Z"
        fill="none"
        stroke="url(#bk-gold)"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Royal Crown */}
      <path
        d="M32 38 L37 25 L50 33 L63 25 L68 38 L65 48 L35 48 Z"
        fill="url(#bk-gold)"
      />
      {/* Crown jewels */}
      <circle cx="37" cy="24" r="2.2" fill="#fff" />
      <circle cx="50" cy="31" r="2.6" fill="#fff" />
      <circle cx="63" cy="24" r="2.2" fill="#fff" />
      {/* Regal Lion Motif */}
      <path
        d="M44 54 C44 50 47 48 50 48 C53 48 56 50 56 54 C58 56 61 60 59 66 C57 71 52 73 50 73 C48 73 43 71 41 66 C39 60 42 56 44 54 Z"
        fill="url(#bk-gold)"
      />
      {/* Banner / Text BK */}
      <rect x="28" y="75" width="44" height="13" rx="3" fill="#0d1b47" stroke="url(#bk-gold)" strokeWidth="1.5" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#ffe066"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        KINGS
      </text>
    </svg>
  )
}

export function ChitwanRhinosLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Chitwan Rhinos Logo"
    >
      <defs>
        <linearGradient id="cr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f28c28" />
          <stop offset="60%" stopColor="#d96b14" />
          <stop offset="100%" stopColor="#a34700" />
        </linearGradient>
        <linearGradient id="cr-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e344f" />
          <stop offset="100%" stopColor="#0d1b2a)" />
        </linearGradient>
      </defs>
      {/* Shield Base */}
      <path
        d="M50 6 L86 19 C86 56 70 82 50 94 C30 82 14 56 14 19 Z"
        fill="#0f2137"
        stroke="url(#cr-grad)"
        strokeWidth="3.5"
      />
      {/* Inner glow circle */}
      <circle cx="50" cy="46" r="30" fill="url(#cr-grad)" fillOpacity="0.18" />
      {/* Charging Rhino Horn & Armored Head Profile */}
      <path
        d="M32 60 C32 46 41 36 54 34 C58 26 67 22 74 20 C71 27 68 33 66 38 C75 42 78 52 75 62 C71 70 60 72 50 72 C40 72 32 68 32 60 Z"
        fill="url(#cr-grad)"
      />
      {/* Mighty Front Horn */}
      <path
        d="M58 23 C63 18 73 14 78 12 C75 20 70 27 66 32 Z"
        fill="#fff"
      />
      {/* Fierce Eye & Armor plates */}
      <circle cx="56" cy="44" r="2.5" fill="#0f2137" />
      <path d="M42 52 L50 56 M44 60 L52 64" stroke="#0f2137" strokeWidth="2" strokeLinecap="round" />
      {/* Banner */}
      <rect x="24" y="75" width="52" height="13" rx="3" fill="#f28c28" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#0f2137"
        fontSize="9"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        RHINOS
      </text>
    </svg>
  )
}

export function JanakpurBoltsLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Janakpur Bolts Logo"
    >
      <defs>
        <linearGradient id="jb-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff409f" />
          <stop offset="100%" stopColor="#d10069" />
        </linearGradient>
        <linearGradient id="jb-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff740" />
          <stop offset="50%" stopColor="#ffc700" />
          <stop offset="100%" stopColor="#ff8400" />
        </linearGradient>
      </defs>
      {/* Octagonal Mithila Shield */}
      <path
        d="M32 8 L68 8 L90 30 L90 68 L68 92 L32 92 L10 68 L10 30 Z"
        fill="#120c1d"
        stroke="url(#jb-pink)"
        strokeWidth="3.5"
      />
      {/* Mithila Temple Arch Outline */}
      <path
        d="M26 36 C26 22 74 22 74 36 C74 58 50 78 50 78 C50 78 26 58 26 36 Z"
        fill="url(#jb-pink)"
        fillOpacity="0.15"
        stroke="url(#jb-pink)"
        strokeWidth="1"
      />
      {/* Electric Thunderbolt */}
      <path
        d="M55 14 L30 46 L48 46 L38 78 L72 38 L54 38 Z"
        fill="url(#jb-bolt)"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      {/* Flash Sparks */}
      <circle cx="73" cy="32" r="2" fill="#fff740" />
      <circle cx="28" cy="52" r="1.5" fill="#fff740" />
      {/* Banner */}
      <rect x="25" y="78" width="50" height="12" rx="3" fill="url(#jb-pink)" />
      <text
        x="50"
        y="87.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        BOLTS
      </text>
    </svg>
  )
}

export function KarnaliYaksLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Karnali Yaks Logo"
    >
      <defs>
        <linearGradient id="ky-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2b3fff" />
          <stop offset="100%" stopColor="#101968" />
        </linearGradient>
        <linearGradient id="ky-horn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#9fb9f5" />
          <stop offset="100%" stopColor="#607ebd" />
        </linearGradient>
      </defs>
      {/* Diamond-Mountain Shield */}
      <path
        d="M50 6 L88 24 L84 72 L50 94 L16 72 L12 24 Z"
        fill="url(#ky-blue)"
        stroke="#609eff"
        strokeWidth="3.5"
      />
      {/* Himalayan Mountain Peaks Background */}
      <path
        d="M24 52 L38 34 L52 50 L66 32 L80 52 Z"
        fill="#ffffff"
        fillOpacity="0.25"
      />
      <path d="M50 20 L62 38 L38 38 Z" fill="#ffffff" fillOpacity="0.35" />
      {/* Yak Horns Sweeping Wide */}
      <path
        d="M20 28 C26 18 38 24 44 38 C40 38 34 34 26 34 Z"
        fill="url(#ky-horn)"
      />
      <path
        d="M80 28 C74 18 62 24 56 38 C60 38 66 34 74 34 Z"
        fill="url(#ky-horn)"
      />
      {/* Yak Head Face & Muzzle */}
      <path
        d="M36 38 L64 38 L60 62 L50 68 L40 62 Z"
        fill="#0b1236"
        stroke="url(#ky-horn)"
        strokeWidth="1.5"
      />
      {/* Yak Nostrils & Fierce Brow */}
      <circle cx="45" cy="58" r="2" fill="#609eff" />
      <circle cx="55" cy="58" r="2" fill="#609eff" />
      <path d="M42 45 L48 48 M58 45 L52 48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      {/* Banner */}
      <rect x="26" y="76" width="48" height="12" rx="3" fill="#ffffff" />
      <text
        x="50"
        y="85.5"
        textAnchor="middle"
        fill="#101968"
        fontSize="9"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        YAKS
      </text>
    </svg>
  )
}

export function KathmanduGurkhasLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kathmandu Gurkhas Logo"
    >
      <defs>
        <linearGradient id="kg-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22e4d0" />
          <stop offset="60%" stopColor="#0aa495" />
          <stop offset="100%" stopColor="#04564e" />
        </linearGradient>
        <linearGradient id="kg-blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#d5e8e6" />
          <stop offset="100%" stopColor="#87aba7" />
        </linearGradient>
      </defs>
      {/* Fortress Shield */}
      <path
        d="M50 6 L86 20 C86 58 72 82 50 94 C28 82 14 58 14 20 Z"
        fill="#0b171c"
        stroke="url(#kg-teal)"
        strokeWidth="3.5"
      />
      {/* Inner Fortress Ring */}
      <circle cx="50" cy="46" r="28" stroke="url(#kg-teal)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      {/* Crossed Traditional Khukuri Knives */}
      {/* Blade 1 (Top Left to Bottom Right) */}
      <path
        d="M26 24 C32 20 44 26 56 42 L66 56 C62 60 56 60 52 56 L38 38 C30 30 26 26 26 24 Z"
        fill="url(#kg-blade)"
        stroke="#0b171c"
        strokeWidth="1"
      />
      {/* Blade 2 (Top Right to Bottom Left) */}
      <path
        d="M74 24 C68 20 56 26 44 42 L34 56 C38 60 44 60 48 56 L62 38 C70 30 74 26 74 24 Z"
        fill="url(#kg-blade)"
        stroke="#0b171c"
        strokeWidth="1"
      />
      {/* Knife Handles */}
      <rect x="22" y="19" width="7" height="10" rx="1.5" transform="rotate(-40 22 19)" fill="#22e4d0" />
      <rect x="73" y="15" width="7" height="10" rx="1.5" transform="rotate(40 73 15)" fill="#22e4d0" />
      {/* Center Star of Bravery */}
      <polygon
        points="50,38 52.5,44 59,44 53.5,48 55.5,54 50,50 44.5,54 46.5,48 41,44 47.5,44"
        fill="#ffffff"
      />
      {/* Banner */}
      <rect x="20" y="75" width="60" height="13" rx="3" fill="url(#kg-teal)" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#0b171c"
        fontSize="8"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        GURKHAS
      </text>
    </svg>
  )
}

export function LumbiniLionsLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Lumbini Lions Logo"
    >
      <defs>
        <linearGradient id="ll-crimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e63946" />
          <stop offset="60%" stopColor="#b31221" />
          <stop offset="100%" stopColor="#75050f" />
        </linearGradient>
        <linearGradient id="ll-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe680" />
          <stop offset="50%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#c29112" />
        </linearGradient>
      </defs>
      {/* Champions Royal Shield Base */}
      <path
        d="M50 5 L88 18 C88 56 72 82 50 95 C28 82 12 56 12 18 Z"
        fill="url(#ll-crimson)"
        stroke="url(#ll-gold)"
        strokeWidth="3.5"
      />
      {/* Star of Champions above Lion */}
      <polygon
        points="50,14 52.5,20 59,20 53.8,24 55.7,30 50,26 44.3,30 46.2,24 41,20 47.5,20"
        fill="url(#ll-gold)"
      />
      {/* Roaring Golden Lion Face */}
      {/* Mane */}
      <path
        d="M32 40 C30 32 38 28 44 32 C50 26 58 30 60 34 C68 30 72 38 68 46 C74 52 70 62 64 66 C58 72 42 72 36 66 C30 62 26 52 32 40 Z"
        fill="url(#ll-gold)"
      />
      {/* Inner Face Mask */}
      <path
        d="M38 44 C38 40 44 38 50 38 C56 38 62 40 62 44 C64 50 60 58 50 62 C40 58 36 50 38 44 Z"
        fill="#75050f"
      />
      {/* Lion Eyes & Whiskers */}
      <ellipse cx="44" cy="46" rx="2" ry="3" fill="#ffe680" />
      <ellipse cx="56" cy="46" rx="2" ry="3" fill="#ffe680" />
      <polygon points="50,52 47,49 53,49" fill="#ffe680" />
      {/* Banner */}
      <rect x="24" y="75" width="52" height="13" rx="3" fill="#150205" stroke="url(#ll-gold)" strokeWidth="1.5" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#ffe680"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        LIONS
      </text>
    </svg>
  )
}

export function PokharaAvengersLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pokhara Avengers Logo"
    >
      <defs>
        <linearGradient id="pa-wine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b5173f" />
          <stop offset="60%" stopColor="#850827" />
          <stop offset="100%" stopColor="#480010" />
        </linearGradient>
        <linearGradient id="pa-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#f77f00" />
        </linearGradient>
      </defs>
      {/* Shield Base */}
      <path
        d="M50 6 L88 22 C88 58 72 84 50 95 C28 84 12 58 12 22 Z"
        fill="url(#pa-wine)"
        stroke="url(#pa-wing)"
        strokeWidth="3.5"
      />
      {/* Fishtail Mountain (Machapuchare) Dual Peak in the Background */}
      <path
        d="M32 50 L44 26 L50 36 L56 26 L68 50 Z"
        fill="#ffffff"
        fillOpacity="0.85"
      />
      <path d="M44 26 L50 36 L56 26 Z" fill="#b5173f" fillOpacity="0.3" />
      {/* Falcon / Avenger Soaring Wings */}
      <path
        d="M18 40 C28 32 40 38 48 50 C38 52 28 48 18 40 Z"
        fill="url(#pa-wing)"
      />
      <path
        d="M82 40 C72 32 60 38 52 50 C62 52 72 48 82 40 Z"
        fill="url(#pa-wing)"
      />
      {/* Avenger "A" Arrow Chevron Crest */}
      <path
        d="M50 38 L62 66 L54 66 L50 56 L46 66 L38 66 Z"
        fill="#ffffff"
      />
      <path d="M48 50 L52 50 L50 44 Z" fill="#b5173f" />
      {/* Banner */}
      <rect x="20" y="75" width="60" height="13" rx="3" fill="#180106" stroke="url(#pa-wing)" strokeWidth="1.5" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#ffd166"
        fontSize="8"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        AVENGERS
      </text>
    </svg>
  )
}

export function SudurpaschimRoyalsLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sudurpaschim Royals Logo"
    >
      <defs>
        <linearGradient id="sr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="50%" stopColor="#ffd23f" />
          <stop offset="100%" stopColor="#d49b00" />
        </linearGradient>
        <linearGradient id="sr-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0b0f17" />
        </linearGradient>
      </defs>
      {/* Regal Diamond Shield */}
      <path
        d="M50 5 L88 20 C88 60 72 82 50 95 C28 82 12 60 12 20 Z"
        fill="url(#sr-dark)"
        stroke="url(#sr-gold)"
        strokeWidth="3.5"
      />
      {/* Sunburst Rays of the Far West */}
      <g stroke="url(#sr-gold)" strokeWidth="1" opacity="0.35">
        <line x1="50" y1="46" x2="50" y2="18" />
        <line x1="50" y1="46" x2="70" y2="24" />
        <line x1="50" y1="46" x2="30" y2="24" />
        <line x1="50" y1="46" x2="76" y2="40" />
        <line x1="50" y1="46" x2="24" y2="40" />
      </g>
      {/* Royal Crown with 5 peaks */}
      <path
        d="M28 46 L32 28 L42 38 L50 24 L58 38 L68 28 L72 46 L70 54 L30 54 Z"
        fill="url(#sr-gold)"
      />
      {/* Crown Emerald Jewels */}
      <circle cx="32" cy="27" r="2.2" fill="#22c55e" />
      <circle cx="50" cy="23" r="2.6" fill="#ef4444" />
      <circle cx="68" cy="27" r="2.2" fill="#22c55e" />
      <circle cx="50" cy="46" r="3" fill="#0b0f17" />
      {/* Royal Scepter & Star below */}
      <polygon
        points="50,57 52,62 57,62 53,65 55,70 50,67 45,70 47,65 43,62 48,62"
        fill="url(#sr-gold)"
      />
      {/* Banner */}
      <rect x="22" y="75" width="56" height="13" rx="3" fill="url(#sr-gold)" />
      <text
        x="50"
        y="85"
        textAnchor="middle"
        fill="#0b0f17"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.2"
      >
        ROYALS
      </text>
    </svg>
  )
}

export function NPLLeagueLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nepal Premier League Official Logo"
    >
      <defs>
        <linearGradient id="npl-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="npl-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      {/* Nepal Double Pennon Flag Crest */}
      <path
        d="M20 12 L75 40 L45 42 L80 72 L20 72 Z"
        fill="url(#npl-red)"
        stroke="url(#npl-gold)"
        strokeWidth="3"
      />
      {/* Moon Symbol in upper pennon */}
      <circle cx="36" cy="30" r="5" fill="#ffffff" />
      <circle cx="38" cy="29" r="4.2" fill="url(#npl-red)" />
      {/* Sun Symbol in lower pennon */}
      <circle cx="36" cy="56" r="5" fill="#ffffff" />
      {/* Cricket Ball & Seam */}
      <circle cx="70" cy="56" r="14" fill="#ca8a04" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M62 48 C68 54 68 58 78 64" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

/**
 * Universal team logo renderer matching team ID
 */
export function TeamLogo({ teamId, size = 48, className = '' }) {
  switch (teamId) {
    case 'biratnagar-kings':
      return <BiratnagarKingsLogo size={size} className={className} />
    case 'chitwan-rhinos':
      return <ChitwanRhinosLogo size={size} className={className} />
    case 'janakpur-bolts':
      return <JanakpurBoltsLogo size={size} className={className} />
    case 'karnali-yaks':
      return <KarnaliYaksLogo size={size} className={className} />
    case 'kathmandu-gurkhas':
      return <KathmanduGurkhasLogo size={size} className={className} />
    case 'lumbini-lions':
      return <LumbiniLionsLogo size={size} className={className} />
    case 'pokhara-avengers':
      return <PokharaAvengersLogo size={size} className={className} />
    case 'sudurpaschim-royals':
      return <SudurpaschimRoyalsLogo size={size} className={className} />
    default:
      return <NPLLeagueLogo size={size} className={className} />
  }
}
