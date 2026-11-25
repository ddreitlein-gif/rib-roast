// Original inline SVG illustration of a standing rib roast on a platter.
// Props:
//   stage     'raw' (before oven), 'roasting', 'rested' (out, not seared), 'seared'
//   progress  0..1, fills the gold ring from oven-in to the meal
//   hot       show steam
export default function HeroRoast({ stage = 'raw', progress = 0, hot = false, year }) {
  const crust = {
    raw: ['#c98a86', '#b4706d'],
    roasting: ['#9a5a3c', '#7d4630'],
    rested: ['#8c4f33', '#6e3a25'],
    seared: ['#5a2a17', '#3d1a0d'],
  }[stage];
  const center = stage === 'raw' ? '#e7a3a6' : '#d0566a';
  const mid = stage === 'raw' ? '#d98d92' : '#b8394f';
  // Ring around the platter: an ellipse path, drawn with dash offset.
  const ringLen = 1000;
  const p = Math.max(0, Math.min(1, progress));

  return (
    <figure className="hero" aria-label="Illustration of a standing rib roast on a platter">
      <svg viewBox="0 0 600 420" role="img" className="hero-svg">
        <title>Thanksgiving Prime Rib</title>
        <defs>
          <radialGradient id="cutFace" cx="50%" cy="52%" r="55%">
            <stop offset="0%" stopColor={center} />
            <stop offset="55%" stopColor={mid} />
            <stop offset="80%" stopColor="#9c4a52" />
            <stop offset="92%" stopColor={crust[0]} />
            <stop offset="100%" stopColor={crust[1]} />
          </radialGradient>
          <radialGradient id="sliceFace" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={center} />
            <stop offset="65%" stopColor={mid} />
            <stop offset="88%" stopColor={crust[0]} />
            <stop offset="100%" stopColor={crust[1]} />
          </radialGradient>
          <linearGradient id="crustSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={crust[1]} />
            <stop offset="50%" stopColor={crust[0]} />
            <stop offset="100%" stopColor={crust[1]} />
          </linearGradient>
          <linearGradient id="fatCap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stage === 'seared' ? '#c9935a' : stage === 'raw' ? '#f6ecd8' : '#e8c99a'} />
            <stop offset="100%" stopColor={stage === 'seared' ? '#8e5a2e' : stage === 'raw' ? '#eadcc0' : '#c59a63'} />
          </linearGradient>
          <linearGradient id="platter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbf6ea" />
            <stop offset="100%" stopColor="#e9dcc1" />
          </linearGradient>
          <linearGradient id="bone" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#efe2c6" />
            <stop offset="60%" stopColor="#fbf3e2" />
            <stop offset="100%" stopColor="#d9c7a2" />
          </linearGradient>
        </defs>

        {/* Platter shadow, platter, rim */}
        <ellipse cx="300" cy="318" rx="250" ry="70" fill="#3a1d1d" opacity="0.10" />
        <ellipse cx="300" cy="306" rx="246" ry="72" fill="url(#platter)" stroke="#b8892f" strokeWidth="3" />
        <ellipse cx="300" cy="302" rx="214" ry="56" fill="none" stroke="#d9c39a" strokeWidth="2" />

        {/* Progress ring */}
        <ellipse cx="300" cy="306" rx="262" ry="84" fill="none" stroke="#e8cf8f" strokeWidth="5" opacity="0.45" />
        <ellipse
          cx="300" cy="306" rx="262" ry="84" fill="none" stroke="#b8892f" strokeWidth="5"
          pathLength={ringLen} strokeDasharray={ringLen} strokeDashoffset={ringLen * (1 - p)}
          strokeLinecap="round" transform="rotate(-90 300 306)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          className="ring"
        />

        {/* Rosemary sprigs */}
        <g stroke="#5f7350" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M96 300 Q150 270 210 286" />
          <path d="M430 330 Q480 312 528 296" />
        </g>
        <g fill="#7d8f69">
          {[[110, 293, -30], [126, 286, 20], [142, 281, -25], [158, 278, 25], [174, 278, -20], [190, 281, 20],
            [446, 324, -25], [462, 318, 20], [478, 312, -20], [494, 306, 25], [510, 301, -20]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="3" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>

        {/* Cranberries */}
        <g fill="#9b1b30">
          {[[150, 330], [166, 338], [140, 342], [430, 290], [446, 282], [416, 300], [464, 344], [478, 336]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" />
          ))}
        </g>
        <g fill="#fff" opacity="0.5">
          {[[148, 327], [164, 335], [428, 287], [462, 341]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" />)}
        </g>

        {/* Halved head of garlic */}
        <g transform="translate(470 268)">
          <ellipse cx="0" cy="0" rx="24" ry="17" fill="#f3ead6" stroke="#c9b68f" strokeWidth="2" />
          {[[-11, -2], [0, -6], [11, -2], [-6, 7], [6, 7]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="5.5" ry="4.5" fill={stage === 'raw' ? '#fbf6ea' : '#ead39c'} stroke="#d8c59f" strokeWidth="1" />
          ))}
        </g>

        {/* Standing roast: back crust side, fat cap, cut face */}
        <path d="M220 160 Q300 128 392 152 L404 274 Q312 300 214 280 Z" fill="url(#crustSide)" />
        <path d="M224 160 Q300 118 390 150 Q380 170 360 172 Q300 156 236 178 Q224 172 224 160 Z" fill="url(#fatCap)" />
        {/* Frenched rib bones */}
        <g>
          <path d="M318 150 Q330 98 352 70 L364 76 Q346 106 336 152 Z" fill="url(#bone)" stroke="#c9b68f" strokeWidth="1.5" />
          <ellipse cx="358" cy="72" rx="9" ry="6" fill="#fbf3e2" stroke="#c9b68f" strokeWidth="1.5" />
          <path d="M352 156 Q368 108 392 84 L402 92 Q382 118 370 160 Z" fill="url(#bone)" stroke="#c9b68f" strokeWidth="1.5" />
          <ellipse cx="397" cy="88" rx="9" ry="6" fill="#fbf3e2" stroke="#c9b68f" strokeWidth="1.5" />
        </g>
        {/* Cut face, three-quarter view */}
        <path d="M214 176 Q246 160 286 170 Q312 196 306 240 Q298 282 262 290 Q222 288 210 250 Q202 208 214 176 Z" fill="url(#cutFace)" />
        <path d="M214 176 Q246 160 286 170" fill="none" stroke="url(#fatCap)" strokeWidth="9" strokeLinecap="round" />
        <path d="M244 214 Q262 226 278 214" fill="none" stroke="#f1c9c9" strokeWidth="2" opacity="0.6" />

        {/* One slice laid forward */}
        <g transform="translate(206 300) rotate(-8)">
          <ellipse cx="0" cy="0" rx="70" ry="28" fill={crust[1]} />
          <ellipse cx="0" cy="-5" rx="66" ry="25" fill="url(#sliceFace)" />
          <path d="M-62 -14 Q0 -36 62 -14" fill="none" stroke="url(#fatCap)" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Gravy boat */}
        <g transform="translate(110 240)">
          <path d="M-46 0 Q-48 30 0 34 Q44 30 46 0 Z" fill="#f8f1e2" stroke="#b8892f" strokeWidth="2.5" />
          <path d="M46 0 Q66 -6 76 -18 Q66 4 44 14 Z" fill="#f8f1e2" stroke="#b8892f" strokeWidth="2.5" />
          <path d="M-46 0 Q-66 0 -64 16 Q-62 28 -40 22" fill="none" stroke="#b8892f" strokeWidth="4" />
          <ellipse cx="0" cy="0" rx="46" ry="10" fill="#6a3a1e" stroke="#b8892f" strokeWidth="2.5" />
          <ellipse cx="0" cy="38" rx="28" ry="6" fill="#e9dcc1" stroke="#b8892f" strokeWidth="2" />
        </g>

        {/* Steam */}
        {hot && (
          <g className="steam" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.8">
            <path className="wisp w1" d="M252 150 Q240 120 256 96 Q272 72 258 44" />
            <path className="wisp w2" d="M298 136 Q286 104 302 80 Q318 56 304 26" />
            <path className="wisp w3" d="M196 168 Q184 140 200 118 Q216 96 202 70" />
          </g>
        )}
      </svg>
      <figcaption className="hero-banner">
        <span className="hero-title">Thanksgiving Prime Rib</span>
        <span className="hero-year">{year}</span>
      </figcaption>
    </figure>
  );
}
