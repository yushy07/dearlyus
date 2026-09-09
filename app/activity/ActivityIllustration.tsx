import { useId, type ReactNode } from 'react';

const cream = '#fff5df',
  rose = '#b97883',
  plum = '#794c58',
  sage = '#7d917b',
  gold = '#c7a36a';
const heart =
  'M0 5C-15-5-18-16-10-19C-5-22-1-19 0-16C3-22 10-22 14-17C21-8 8 0 0 5Z';
const Heart = ({
  x,
  y,
  fill = rose,
  scale = 1,
}: {
  x: number;
  y: number;
  fill?: string;
  scale?: number;
}) => (
  <path
    d={heart}
    fill={fill}
    transform={`translate(${x} ${y}) scale(${scale})`}
  />
);
const Line = ({ d }: { d: string }) => (
  <path
    d={d}
    fill="none"
    stroke="#b9a58b"
    strokeWidth="3"
    strokeLinecap="round"
  />
);

/** Each activity has a distinct object silhouette, with paper edges and cast shadows. */
const artwork: Record<string, ReactNode> = {
  quiz: (
    <>
      <rect x="45" y="26" width="94" height="115" rx="7" fill="#c7b298" />
      <rect x="41" y="20" width="94" height="115" rx="7" fill={cream} />
      <rect x="65" y="15" width="46" height="15" rx="5" fill={plum} />
      <text
        x="88"
        y="83"
        textAnchor="middle"
        fontSize="49"
        fontFamily="Georgia"
        fill={plum}
      >
        ?
      </text>
      <circle cx="61" cy="108" r="7" fill={sage} />
      <path d="m57 108 3 3 5-6" fill="none" stroke={cream} strokeWidth="2" />
      <Line d="M77 108h39" />
      <Heart x={134} y={132} scale={0.75} />
    </>
  ),
  host: (
    <>
      <ellipse cx="90" cy="140" rx="38" ry="7" fill="#b5a18e" />
      <rect x="84" y="100" width="12" height="35" fill={gold} />
      <ellipse cx="90" cy="133" rx="29" ry="6" fill={plum} />
      <path
        d="M58 63v18a32 32 0 0064 0V63"
        fill="none"
        stroke={gold}
        strokeWidth="7"
      />
      <rect x="70" y="20" width="40" height="80" rx="20" fill={plum} />
      <rect x="74" y="20" width="32" height="72" rx="16" fill={rose} />
      <path
        d="M80 34h20m-20 11h20m-20 11h20m-20 11h20"
        stroke={cream}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Heart x={138} y={55} scale={0.5} />
    </>
  ),
  arcade: (
    <>
      <path d="M45 19h85l12 119H37Z" fill="#4b594e" />
      <path d="M40 16h83l7 91H34Z" fill={sage} />
      <rect x="47" y="27" width="63" height="12" rx="2" fill={cream} />
      <rect x="44" y="47" width="70" height="46" rx="4" fill="#38453b" />
      <Heart x={79} y={81} fill="#e1b3b2" scale={0.8} />
      <path d="M34 107h96l12 18H26Z" fill="#afbea1" />
      <path d="M26 125h116v17H26Z" fill="#64755f" />
      <path d="M54 114V99" stroke={plum} strokeWidth="5" />
      <circle cx="54" cy="97" r="7" fill={rose} />
      <ellipse cx="105" cy="114" rx="6" ry="3" fill={plum} />
      <ellipse cx="90" cy="114" rx="6" ry="3" fill={rose} />
    </>
  ),
  scrapbook: (
    <>
      <rect x="36" y="27" width="110" height="113" rx="5" fill="#bcae94" />
      <rect x="31" y="20" width="110" height="115" rx="5" fill={sage} />
      <rect x="42" y="20" width="4" height="115" fill="#526a54" />
      {[38, 62, 86, 110].map((y) => (
        <path
          key={y}
          d={`M26 ${y}q-9-10 7-10h11`}
          fill="none"
          stroke={gold}
          strokeWidth="4"
        />
      ))}
      <g transform="rotate(9 94 72)">
        <rect x="61" y="42" width="65" height="69" fill={cream} />
        <rect x="67" y="48" width="53" height="45" fill="#d9b6a6" />
        <circle cx="81" cy="62" r="7" fill="#f9e9bd" />
        <path d="m67 93 19-24 13 13 10-16 11 27" fill="#8c9a7a" />
        <rect x="83" y="37" width="27" height="11" fill="#dbca9dc9" />
      </g>
      <Heart x={119} y={127} scale={0.55} />
    </>
  ),
  match: (
    <>
      <path
        d="M35 47h43v18c20-12 20 20 0 9v24H35Z"
        fill="#a76170"
        transform="translate(2 5)"
      />
      <path d="M35 42h43v18c20-12 20 20 0 9v24H35Z" fill={rose} />
      <path
        d="M143 107h-43V89c-20 12-20-20 0-9V56h43Z"
        fill="#5b705d"
        transform="translate(2 5)"
      />
      <path d="M143 102h-43V84c-20 12-20-20 0-9V51h43Z" fill={sage} />
      <Heart x={86} y={131} scale={0.65} />
      <path
        d="m71 23 9 8m16-13-2 11m20-6-9 8"
        stroke={gold}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  iq: (
    <>
      <path d="M28 118h50l-6 14H34Z" fill={plum} />
      <path d="M37 110V92l7-16-5-14 15-27 16 16-9 18 9 14v27Z" fill={rose} />
      <path d="M36 115h35" stroke={cream} strokeWidth="3" />
      <circle cx="55" cy="55" r="3" fill={plum} />
      <path d="M101 118h50l-6 14h-38Z" fill="#52634f" />
      <path d="M111 111V91l8-17-6-14 13-27 16 17-9 18 10 16v27Z" fill={sage} />
      <circle cx="128" cy="54" r="3" fill={cream} />
      <text
        x="89"
        y="80"
        textAnchor="middle"
        fontFamily="Georgia"
        fontStyle="italic"
        fontSize="18"
        fill={plum}
      >
        vs
      </text>
    </>
  ),
  riddle: (
    <>
      <path d="m94 24 3-9 5 10 11 2-9 6 2 11-10-5-9 6 1-12-8-6Z" fill={gold} />
      <path d="M133 21a28 28 0 0026 37 30 30 0 11-26-37" fill={gold} />
      <path d="M42 85h76v50H42Z" fill="#ad8770" />
      <path d="M40 79h76v50H40Z" fill={cream} />
      <path
        d="M54 79V62a24 24 0 0148 0v17"
        fill="none"
        stroke={sage}
        strokeWidth="10"
      />
      <text
        x="78"
        y="116"
        textAnchor="middle"
        fontFamily="Georgia"
        fontSize="33"
        fill={plum}
      >
        ?
      </text>
    </>
  ),
  lab: (
    <>
      <path
        d="M72 27h36v10h-6v35l31 48q8 17-12 18H59q-20-1-12-18l31-48V37h-6Z"
        fill="#bcc9ba"
      />
      <path d="M79 37h16v38l28 46q5 8-5 8H62q-11 0-6-8l29-46V37" fill={cream} />
      <path
        d="m67 100-12 23q-2 6 6 6h58q8 0 4-7l-12-22q-19 10-44 0"
        fill={rose}
      />
      <circle cx="82" cy="111" r="4" fill="#efccc2" />
      <circle cx="102" cy="119" r="3" fill="#efccc2" />
      <circle cx="88" cy="81" r="5" fill={rose} />
      <circle cx="112" cy="46" r="6" fill={sage} />
      <circle cx="124" cy="25" r="3" fill={gold} />
      <path d="M77 31h26" stroke={sage} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  debate: (
    <>
      <path
        d="M22 42q0-12 12-12h65q12 0 12 12v38q0 12-12 12H56L37 109V92H34q-12 0-12-12Z"
        fill={plum}
      />
      <path
        d="M21 36q0-12 12-12h65q12 0 12 12v38q0 12-12 12H55L36 103V86h-3q-12 0-12-12Z"
        fill={rose}
      />
      <path
        d="M80 78q0-10 10-10h55q10 0 10 10v33q0 10-10 10h-8l8 16-27-16H90q-10 0-10-10Z"
        fill={sage}
      />
      <path
        d="M39 46h51M39 60h32M95 87h43M95 100h30"
        stroke={cream}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
  court: (
    <>
      <ellipse cx="87" cy="135" rx="43" ry="8" fill="#bda48d" />
      <path d="M47 125q40-13 80 0v9H47Z" fill={plum} />
      <ellipse cx="87" cy="124" rx="40" ry="8" fill={rose} />
      <g transform="rotate(-36 91 74)">
        <rect x="84" y="43" width="13" height="78" rx="5" fill="#ac875a" />
        <rect x="56" y="38" width="70" height="30" rx="7" fill={plum} />
        <rect x="56" y="34" width="70" height="30" rx="7" fill={rose} />
        <path d="M66 35v28m50-28v28" stroke={gold} strokeWidth="5" />
      </g>
    </>
  ),
  draw: (
    <>
      <path
        d="m52 142 34-118 9 1 34 117M72 103h42"
        fill="none"
        stroke="#b59671"
        strokeWidth="7"
      />
      <rect x="42" y="37" width="101" height="84" rx="2" fill="#baa285" />
      <rect x="37" y="31" width="101" height="84" rx="2" fill={cream} />
      <path
        d="m52 85 18-30 27 36 24-27"
        fill="none"
        stroke={sage}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Heart x={104} y={66} scale={0.55} />
      <g transform="rotate(24 133 106)">
        <rect x="130" y="80" width="7" height="62" rx="3" fill={plum} />
        <path d="M128 82q-4-20 6-27 10 17 6 27Z" fill={gold} />
      </g>
    </>
  ),
  hunt: (
    <>
      <path
        d="m40 52 12-13h35l12 13h25q10 0 10 10v54H27V63q0-11 13-11"
        fill={plum}
      />
      <path
        d="m36 46 12-13h35l12 13h25q10 0 10 10v54H23V57q0-11 13-11"
        fill={sage}
      />
      <circle cx="74" cy="79" r="25" fill={cream} />
      <circle cx="74" cy="79" r="18" fill="#536357" />
      <circle cx="68" cy="72" r="6" fill="#a9b8a1" />
      <rect x="102" y="53" width="17" height="8" rx="2" fill={cream} />
      <circle
        cx="127"
        cy="111"
        r="22"
        fill="none"
        stroke={gold}
        strokeWidth="7"
      />
      <path
        d="m143 127 14 16"
        stroke={plum}
        strokeWidth="9"
        strokeLinecap="round"
      />
    </>
  ),
  future: (
    <>
      <path d="M40 82 92 35l52 47v53H40Z" fill="#b5a58f" />
      <path d="M34 76 86 29l52 47v53H34Z" fill={cream} />
      <path
        d="m25 80 61-58 61 58"
        fill="none"
        stroke={rose}
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <rect x="73" y="94" width="25" height="35" rx="10" fill={sage} />
      <rect x="47" y="78" width="15" height="18" rx="2" fill={gold} />
      <rect x="110" y="78" width="15" height="18" rx="2" fill={gold} />
      <Heart x={85} y={73} scale={0.6} />
      <path d="M144 39v-12m-6 6h12" stroke={gold} strokeWidth="3" />
    </>
  ),
  birthday: (
    <>
      <rect x="39" y="65" width="104" height="71" rx="5" fill="#a66b75" />
      <rect x="35" y="59" width="104" height="71" rx="5" fill={rose} />
      <rect x="30" y="48" width="114" height="22" rx="4" fill="#d4a099" />
      <rect x="79" y="48" width="19" height="82" fill={gold} />
      <path
        d="M86 48C36 46 53 6 76 27l10 21c49-2 34-42 11-21Z"
        fill="none"
        stroke={gold}
        strokeWidth="8"
      />
      <path
        d="m31 29-7-8m117 13 10-7m-36-9 3-10"
        stroke={sage}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  fashion: (
    <>
      <path
        d="M71 37q0-18 14-18 15 0 15 12 0 9-15 15v8"
        fill="none"
        stroke={gold}
        strokeWidth="4"
      />
      <path
        d="m86 52-51 30h103Z"
        fill="none"
        stroke={gold}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m66 53 10 12h21l10-12-4 36 31 47H39l30-47Z" fill={plum} />
      <path d="m62 49 10 12h21l10-12-4 36 31 47H35l30-47Z" fill={rose} />
      <path d="M66 85h34" stroke={gold} strokeWidth="5" />
      <path
        d="m73 93-12 32m26-32v32m12-30 13 29"
        stroke="#d9a2a4"
        strokeWidth="3"
      />
    </>
  ),
  shirts: (
    <>
      <g transform="rotate(-12 65 80)">
        <path
          d="m39 37-24 16 14 22 11-8v61h54V67l11 8 14-22-24-16-13 9H52Z"
          fill="#bfae93"
        />
        <path
          d="m35 32-24 16 14 22 11-8v61h54V62l11 8 14-22-24-16-13 9H48Z"
          fill={cream}
        />
        <Heart x={63} y={84} scale={0.7} />
      </g>
      <g transform="translate(57 18) rotate(10 60 70) scale(.85)">
        <path
          d="m35 32-24 16 14 22 11-8v61h54V62l11 8 14-22-24-16-13 9H48Z"
          fill={sage}
        />
        <Heart x={63} y={84} fill={cream} scale={0.7} />
      </g>
    </>
  ),
  forecast: (
    <>
      <circle cx="63" cy="56" r="27" fill={gold} />
      <path
        d="M63 16V8M29 25l-7-7m2 39H12m91-23 9-6"
        stroke={gold}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M44 97a21 21 0 010-42 30 30 0 0154-10 24 24 0 0130 23 17 17 0 010 34H44"
        fill="#c2b6a4"
      />
      <path
        d="M40 91a21 21 0 010-42 30 30 0 0154-10 24 24 0 0130 23 17 17 0 010 34H40"
        fill={cream}
      />
      <Heart x={57} y={127} scale={0.45} />
      <Heart x={88} y={140} scale={0.45} />
      <Heart x={119} y={124} scale={0.45} />
    </>
  ),
  timezone: (
    <>
      <circle cx="69" cy="79" r="47" fill="#b59b7d" />
      <circle cx="65" cy="73" r="47" fill={sage} />
      <circle cx="65" cy="73" r="38" fill={cream} />
      <path
        d="M65 45v29l20 12"
        fill="none"
        stroke={plum}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M65 39v5m0 59v5M31 73h5m58 0h5" stroke={gold} strokeWidth="3" />
      <circle cx="119" cy="107" r="33" fill={rose} />
      <circle cx="119" cy="107" r="26" fill={cream} />
      <path
        d="M119 88v19l-12 8"
        stroke={plum}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="m116 27 27 12-14 5-5 15Z" fill={gold} />
    </>
  ),
  bucket: (
    <>
      <rect x="45" y="20" width="95" height="119" rx="6" fill="#b8a58b" />
      <rect x="40" y="15" width="95" height="119" rx="6" fill={cream} />
      <path d="M40 42h95" stroke={rose} strokeWidth="3" />
      <text
        x="87"
        y="36"
        textAnchor="middle"
        fontSize="17"
        fontFamily="Georgia"
        fill={plum}
      >
        100 little dates
      </text>
      {[62, 87, 112].map((y) => (
        <g key={y}>
          <rect x="54" y={y - 8} width="14" height="14" rx="2" fill={sage} />
          <path
            d={`m57 ${y - 1} 3 3 5-7`}
            fill="none"
            stroke={cream}
            strokeWidth="2"
          />
          <Line d={`M78 ${y}h38`} />
        </g>
      ))}
    </>
  ),
  date: (
    <>
      <rect x="32" y="31" width="119" height="105" rx="7" fill="#b19c87" />
      <rect x="27" y="25" width="119" height="105" rx="7" fill={cream} />
      <path d="M27 32q0-7 7-7h105q7 0 7 7v22H27Z" fill={plum} />
      <path
        d="M53 16v21m67-21v21"
        stroke={gold}
        strokeWidth="7"
        strokeLinecap="round"
      />
      {[49, 76, 103, 130].map((x) => (
        <g key={x}>
          {[72, 95, 117].map((y) => (
            <circle key={y} cx={x} cy={y} r="3" fill="#cfbfa8" />
          ))}
        </g>
      ))}
      <Heart x={89} y={104} scale={1.1} />
    </>
  ),
};

export function ActivityIllustration({ activity }: { activity: string }) {
  const id = useId();
  return (
    <div
      className="collection-object collection-object--unique"
      data-artwork={activity}
      aria-hidden="true"
    >
      <svg viewBox="0 0 180 160" fill="none">
        <defs>
          <filter id={id} x="-30%" y="-25%" width="170%" height="180%">
            <feDropShadow
              dx="5"
              dy="10"
              stdDeviation="5"
              floodColor="#493039"
              floodOpacity=".2"
            />
          </filter>
        </defs>
        <g filter={`url(#${id})`}>{artwork[activity]}</g>
      </svg>
    </div>
  );
}
