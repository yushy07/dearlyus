'use client';

import { useEffect, useState, type PointerEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Search,
  Heart,
  Sparkles,
  MoonStar,
  Zap,
  Coffee,
  Palette,
  Clock3,
} from 'lucide-react';
import { Navbar } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';
import './activity-collection.css';
import { ActivityIllustration } from './ActivityIllustration';
import { listRecoverableActivitySessions } from '@/lib/activity-session';

type Category = 'all' | 'play' | 'talk' | 'make' | 'distance';
type FilterTag =
  | 'all'
  | '10m'
  | 'no-camera'
  | 'low-energy'
  | 'make-something'
  | 'competitive'
  | 'deep-talk'
  | 'works-solo';

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All experiences' },
  { id: 'play', label: 'A little competition' },
  { id: 'talk', label: 'Closer conversations' },
  { id: 'make', label: 'Make a memory' },
  { id: 'distance', label: 'Across the miles' },
];

const FILTER_TAGS: { id: FilterTag; label: string }[] = [
  { id: 'all', label: 'All Moods' },
  { id: '10m', label: '⏱️ Under 15m' },
  { id: 'no-camera', label: '🙈 No Camera' },
  { id: 'low-energy', label: '☕ Low Energy' },
  { id: 'make-something', label: '🎨 Make Something' },
  { id: 'competitive', label: '⚡ Competitive' },
  { id: 'deep-talk', label: '🕯️ Deep Talk' },
  { id: 'works-solo', label: '👤 Works Solo' },
];

interface ActivityItem {
  href: string;
  title: string;
  description: string;
  category: Exclude<Category, 'all'>;
  motif: string;
  duration: string;
  camera: 'none' | 'optional' | 'required';
  energy: 'low' | 'medium' | 'high';
  keepsake: string;
  tags: FilterTag[];
}

const activities: ActivityItem[] = [
  {
    href: '/photobooth',
    title: 'The Photobooth',
    description: 'A shared countdown. A vintage 4-cut photostrip of little moments to keep.',
    category: 'make',
    motif: 'photo',
    duration: '10m',
    camera: 'required',
    energy: 'medium',
    keepsake: '4-Cut Photostrip',
    tags: ['10m', 'make-something'],
  },
  {
    href: '/quiz',
    title: 'Know Me Quiz',
    description: 'You know their coffee order. What about their secret dream?',
    category: 'talk',
    motif: 'quiz',
    duration: '15m',
    camera: 'optional',
    energy: 'medium',
    keepsake: 'Quiz Receipt',
    tags: ['deep-talk', 'competitive', 'works-solo'],
  },
  {
    href: '/letter',
    title: 'Letters to the Future',
    description: 'A little of today, sealed in wax and voice audio for the two of you tomorrow.',
    category: 'make',
    motif: 'letter',
    duration: '20m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Wax-Sealed Letter',
    tags: ['no-camera', 'low-energy', 'make-something', 'deep-talk', 'works-solo'],
  },
  {
    href: '/dare',
    title: 'Truth or Dare',
    description: 'A brave answer, playful confession, or camera dare. Your move.',
    category: 'play',
    motif: 'dice',
    duration: '15m',
    camera: 'optional',
    energy: 'high',
    keepsake: 'Challenge Passport',
    tags: ['competitive'],
  },
  {
    href: '/cards',
    title: 'Honest Cards',
    description: 'Make room for the vulnerable, intimate conversations you rarely get to have.',
    category: 'talk',
    motif: 'cards',
    duration: '20m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Reflection Keepsake',
    tags: ['no-camera', 'low-energy', 'deep-talk', 'works-solo'],
  },
  {
    href: '/host',
    title: 'Date Host',
    description: 'A three-act structured evening with tone check-in, dilemmas, and thermal receipt.',
    category: 'talk',
    motif: 'host',
    duration: '25m',
    camera: 'optional',
    energy: 'medium',
    keepsake: 'Date Receipt',
    tags: ['deep-talk', 'works-solo'],
  },
  {
    href: '/arcade',
    title: 'The Arcade',
    description: '60 FPS physics games. High score rematches. One very smug winner.',
    category: 'play',
    motif: 'arcade',
    duration: '15m',
    camera: 'none',
    energy: 'high',
    keepsake: 'Score Certificate',
    tags: ['10m', 'no-camera', 'competitive', 'works-solo'],
  },
  {
    href: '/scrapbook',
    title: 'Digital Scrapbook',
    description: 'Tape down your polaroids, concert tickets, and washi notes together.',
    category: 'make',
    motif: 'scrapbook',
    duration: '20m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Corkboard Collage',
    tags: ['no-camera', 'low-energy', 'make-something', 'works-solo'],
  },
  {
    href: '/match',
    title: 'Love Match',
    description: 'Personality constellation mapping where your instincts meet and complement.',
    category: 'talk',
    motif: 'match',
    duration: '10m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Constellation Map',
    tags: ['10m', 'no-camera', 'low-energy', 'deep-talk', 'works-solo'],
  },
  {
    href: '/iq',
    title: 'IQ Duel',
    description: 'Simultaneous puzzles across logic, sequences, and spatial thinking.',
    category: 'play',
    motif: 'iq',
    duration: '15m',
    camera: 'none',
    energy: 'high',
    keepsake: 'Synergy Certificate',
    tags: ['no-camera', 'competitive', 'works-solo'],
  },
  {
    href: '/riddle',
    title: 'Riddle Night',
    description: 'Cooperative mystery envelope with connected clues, hint ladder, and quest scroll.',
    category: 'play',
    motif: 'riddle',
    duration: '15m',
    camera: 'none',
    energy: 'medium',
    keepsake: 'Quest Scroll',
    tags: ['no-camera', 'make-something', 'works-solo'],
  },
  {
    href: '/lab',
    title: 'The Lab',
    description: 'Shared co-working & study room with dual desks, presence lamps, and local audio.',
    category: 'play',
    motif: 'lab',
    duration: '25m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Study Certificate',
    tags: ['no-camera', 'low-energy', 'works-solo'],
  },
  {
    href: '/debate',
    title: 'The Great Debate',
    description: '60s speech timer, evidence cards, Cupidot verdict, and peace accord parchment.',
    category: 'talk',
    motif: 'debate',
    duration: '15m',
    camera: 'optional',
    energy: 'high',
    keepsake: 'Peace Accord',
    tags: ['competitive', 'works-solo'],
  },
  {
    href: '/court',
    title: 'Couples Court',
    description: 'Bring your most harmless domestic dispute before the judge with house rule keepsakes.',
    category: 'play',
    motif: 'court',
    duration: '15m',
    camera: 'optional',
    energy: 'high',
    keepsake: 'House Rule Gavel',
    tags: ['competitive', 'works-solo'],
  },
  {
    href: '/draw',
    title: 'Draw Together',
    description: 'Two canvases, one synchronized paper, prompt cycler, and live partner cursor.',
    category: 'make',
    motif: 'draw',
    duration: '15m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Shared Drawing',
    tags: ['no-camera', 'low-energy', 'make-something', 'works-solo'],
  },
  {
    href: '/hunt',
    title: 'Snap Hunt',
    description: '60s sprint. Find the item in your room, photograph it, and reveal proof together.',
    category: 'play',
    motif: 'hunt',
    duration: '10m',
    camera: 'required',
    energy: 'high',
    keepsake: 'Discovery Card',
    tags: ['10m', 'competitive'],
  },
  {
    href: '/future',
    title: 'Our Future',
    description: '3-year collaborative vision board across home, travel, traditions, and closing the distance.',
    category: 'make',
    motif: 'future',
    duration: '20m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Future Blueprint',
    tags: ['no-camera', 'low-energy', 'make-something', 'deep-talk', 'works-solo'],
  },
  {
    href: '/birthday',
    title: 'Birthday Gift',
    description: 'Surprise parcel workshop with interactive candle blowout, voucher, and heart QR.',
    category: 'make',
    motif: 'birthday',
    duration: '15m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Birthday Parcel',
    tags: ['no-camera', 'low-energy', 'make-something', 'works-solo'],
  },
  {
    href: '/fashion',
    title: 'Fashion Show',
    description: 'Paper-doll styling studio with catwalk runway, peer rating, and editorial keepsake.',
    category: 'play',
    motif: 'fashion',
    duration: '15m',
    camera: 'optional',
    energy: 'medium',
    keepsake: 'Runway Programme',
    tags: ['make-something', 'competitive', 'works-solo'],
  },
  {
    href: '/shirts',
    title: 'Matching Shirts',
    description: 'Paired mini studio with side-by-side tees, linked motifs, and dual transparent export.',
    category: 'make',
    motif: 'shirts',
    duration: '15m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Twin Tee Mockup',
    tags: ['no-camera', 'low-energy', 'make-something', 'works-solo'],
  },
  {
    href: '/forecast',
    title: 'Love Forecast',
    description: 'Daily emotional barometer with transparent care prescription and story card export.',
    category: 'distance',
    motif: 'forecast',
    duration: '10m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Story Card (PNG)',
    tags: ['10m', 'no-camera', 'low-energy', 'works-solo'],
  },
  {
    href: '/timezone',
    title: 'Across the Distance',
    description: 'Paired local clocks, a shared-time window, a 3D connection globe, and your next-moment countdown.',
    category: 'distance',
    motif: 'timezone',
    duration: '10m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Distance Moment',
    tags: ['10m', 'no-camera', 'low-energy', 'works-solo'],
  },
  {
    href: '/bucket',
    title: '100 Dates Bucket List',
    description: '100 curated date tickets with gold foil scratch-off and memory passport tracking.',
    category: 'distance',
    motif: 'bucket',
    duration: '15m',
    camera: 'none',
    energy: 'low',
    keepsake: 'Bucket Passport',
    tags: ['no-camera', 'low-energy', 'make-something', 'works-solo'],
  },
  {
    href: '/date',
    title: 'Date Night Planner',
    description: 'Site-wide orchestration layer with preference check, curated arcs, and thermal receipt.',
    category: 'distance',
    motif: 'date',
    duration: '20m',
    camera: 'optional',
    energy: 'medium',
    keepsake: 'Itinerary Receipt',
    tags: ['deep-talk', 'works-solo'],
  },
];

const CURATED_ARCS = [
  {
    id: 'quiet-night',
    number: '01',
    title: 'Quiet Night In',
    mood: 'Soft & unhurried',
    description: 'A slow evening for talking, drawing, and leaving each other something tender.',
    duration: '55 min',
    steps: [
      { title: 'Honest Cards', duration: '20m' },
      { title: 'Draw Together', duration: '15m' },
      { title: 'Letters to Tomorrow', duration: '20m' },
    ],
    path: '/date',
  },
  {
    id: 'chaotic-rematch',
    number: '02',
    title: 'Chaotic Rematch',
    mood: 'Playful & competitive',
    description: 'Big reactions, tiny rivalries, and a photo strip to remember who won.',
    duration: '40 min',
    steps: [
      { title: 'The Arcade', duration: '15m' },
      { title: 'Couples Court', duration: '15m' },
      { title: 'Photobooth Strip', duration: '10m' },
    ],
    path: '/date',
  },
  {
    id: 'reconnect',
    number: '03',
    title: 'Reconnect After a Hard Week',
    mood: 'Low energy & close',
    description: 'Gentle check-ins and shared company when you want closeness without pressure.',
    duration: '40 min',
    steps: [
      { title: 'Love Forecast', duration: '5m' },
      { title: 'Across the Distance', duration: '10m' },
      { title: 'The Lab Co-Work', duration: '25m' },
    ],
    path: '/date',
  },
  {
    id: 'make-a-keepsake',
    number: '04',
    title: 'Make a Keepsake',
    mood: 'Creative & sentimental',
    description: 'Make something together that can live beyond tonight on a wall, shirt, or shelf.',
    duration: '45 min',
    steps: [
      { title: 'Matching Shirts', duration: '15m' },
      { title: 'Digital Scrapbook', duration: '20m' },
      { title: 'Photobooth', duration: '10m' },
    ],
    path: '/date',
  },
] as const;

const ARC_ICONS = {
  'quiet-night': MoonStar,
  'chaotic-rematch': Zap,
  reconnect: Coffee,
  'make-a-keepsake': Palette,
};

function tilt(event: PointerEvent<HTMLAnchorElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    '--tilt-x',
    `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`,
  );
  event.currentTarget.style.setProperty(
    '--tilt-y',
    `${((event.clientX - rect.left) / rect.width - 0.5) * 6}deg`,
  );
}

function resetTilt(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg');
  event.currentTarget.style.setProperty('--tilt-y', '0deg');
}

function ObjectArt({ motif }: { motif: string }) {
  if (!['photo', 'dice', 'letter', 'cards'].includes(motif))
    return <ActivityIllustration activity={motif} />;
  return (
    <div
      className={`collection-object collection-object--${motif}`}
      aria-hidden="true"
    >
      {motif === 'photo' ? (
        <>
          <img src="/photos/frame2.webp" alt="" loading="lazy" />
          <span>just us.</span>
        </>
      ) : motif === 'dice' ? (
        <div className="collection-pips">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      ) : motif === 'letter' ? (
        <>
          <div className="collection-envelope-flap" />
          <span className="collection-seal">♥</span>
        </>
      ) : motif === 'ticket' ? (
        <>
          <small>DEARLY US AIR</small>
          <b>YOU ↔ ME</b>
          <span>ONE WAY TO SOMEDAY</span>
        </>
      ) : (
        <>
          <small>for the two of us</small>
          <Heart size={38} strokeWidth={1.2} />
          <span>one more question?</span>
        </>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { partnerA, partnerB } = useCoupleProfile();
  const [category, setCategory] = useState<Category>('all');
  const [selectedTag, setSelectedTag] = useState<FilterTag>('all');
  const [query, setQuery] = useState('');
  const [recoverable, setRecoverable] = useState<{ sessionId: string; activityType: string; updatedAt: string } | null>(null);

  useEffect(() => {
    void listRecoverableActivitySessions()
      .then((sessions) => setRecoverable(sessions[0] || null))
      .catch(() => setRecoverable(null));
  }, []);

  const visible = activities.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);
    const matchesQuery = `${item.title} ${item.description} ${item.keepsake}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    return matchesCategory && matchesTag && matchesQuery;
  });

  return (
    <div className="activity-collection">
      <Navbar />
      <main className="collection-main">
        {recoverable && (
          <section style={{ maxWidth: '1120px', margin: '20px auto 0', padding: '0 24px' }}>
            <div style={{ background: '#fffaf4', border: '1px solid #d8c5b8', borderRadius: '18px', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', boxShadow: '0 10px 30px rgba(83,49,45,.08)' }}>
              <div>
                <strong style={{ display: 'block', fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '18px' }}>Your date is still waiting</strong>
                <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>Continue {activities.find((item) => item.href === `/${recoverable.activityType}`)?.title || recoverable.activityType} from the shared saved state.</span>
              </div>
              <Link className="collection-primary" href={`/${recoverable.activityType}?session=${recoverable.sessionId}`}>Continue <ArrowUpRight size={17} /></Link>
            </div>
          </section>
        )}
        {/* Hero Section */}
        <section className="collection-hero" aria-labelledby="collection-title">
          <div className="collection-intro">
            <span className="collection-kicker">
              <span /> THE DEARLY US DATE COLLECTION
            </span>
            <h1 id="collection-title">
              A little time.
              <br />A little closer<span className="collection-period">.</span>
            </h1>
            <p>
              For the silly nights, the deep talks, and the
              <br className="collection-desktop-break" /> moments that become{' '}
              <em>your thing.</em>
            </p>
            <a href="#date-collection" className="collection-primary">
              Find your next date <ArrowUpRight size={18} />
            </a>
            <div className="collection-dedication">
              <Heart size={15} />
              <span>
                Set aside for {partnerA} &amp; {partnerB}
              </span>
            </div>
          </div>
          <div
            className="collection-still-life"
            aria-label="A collection of photographs, conversation cards, and a letter"
          >
            <div className="collection-orbit">
              GOOD COMPANY. LITTLE MOMENTS.
            </div>
            <Link
              href="/cards"
              className="collection-hero-deck"
              aria-label="Open Honest Cards"
            >
              <span>01 / CONVERSATION</span>
              <Heart size={48} strokeWidth={1} />
              <strong>
                Tell me
                <br />
                something
                <br />
                <em>only I know.</em>
              </strong>
              <small>HONEST CARDS · DEARLY US</small>
            </Link>
            <Link
              href="/photobooth"
              className="collection-hero-photo"
              aria-label="Open the Photobooth"
            >
              <img
                src="/photos/frame1.webp"
                alt="A couple sharing a happy moment"
              />
              <span>this is our kind of night.</span>
            </Link>
            <Link
              href="/letter"
              className="collection-hero-letter"
              aria-label="Write a letter to the future"
            >
              <ObjectArt motif="letter" />
              <span>to us, with love.</span>
            </Link>
            <div className="collection-hero-die" aria-hidden="true">
              <ObjectArt motif="dice" />
            </div>
            <span className="collection-scene-note">
              a few ways to be together ↗
            </span>
          </div>
        </section>

        <section className="collection-concierge" aria-labelledby="concierge-title">
          <div className="collection-concierge__heading">
            <div>
              <span className="collection-concierge__eyebrow">CURATED FOR THE TWO OF YOU · THREE LITTLE ACTS</span>
              <h2 id="concierge-title">Don&apos;t know what to do tonight?</h2>
              <p>Choose the feeling. We&apos;ll help you turn it into a whole evening together.</p>
            </div>
            <div className="collection-concierge__note" aria-label={`Date ideas for ${partnerA} and ${partnerB}`}>
              <Heart size={16} />
              <span>
                Set aside for
                <strong>{partnerA} &amp; {partnerB}</strong>
              </span>
            </div>
          </div>

          <div className="collection-concierge__grid">
            {CURATED_ARCS.map((arc) => {
              const ArcIcon = ARC_ICONS[arc.id];
              return (
                <Link
                  key={arc.id}
                  href={arc.path}
                  className={`collection-arc collection-arc--${arc.id}`}
                  aria-label={`Build the ${arc.title} date plan`}
                >
                  <div className="collection-arc__topline">
                    <span className="collection-arc__number">ARC {arc.number}</span>
                    <span className="collection-arc__duration"><Clock3 size={14} /> {arc.duration}</span>
                  </div>
                  <div className="collection-arc__intro">
                    <span className="collection-arc__icon" aria-hidden="true"><ArcIcon size={23} /></span>
                    <div>
                      <span className="collection-arc__mood">{arc.mood}</span>
                      <h3>{arc.title}</h3>
                    </div>
                  </div>
                  <p className="collection-arc__description">{arc.description}</p>
                  <ol className="collection-arc__steps" aria-label={`${arc.title} itinerary`}>
                    {arc.steps.map((step, stepIndex) => (
                      <li key={step.title}>
                        <span className="collection-arc__step-number">{stepIndex + 1}</span>
                        <strong>{step.title}</strong>
                        <span>{step.duration}</span>
                      </li>
                    ))}
                  </ol>
                  <span className="collection-arc__cta">
                    Build this date <ArrowUpRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Main Catalogue Section */}
        <section
          id="date-collection"
          className="collection-catalogue"
          aria-labelledby="catalogue-title"
        >
          <div className="collection-section-heading">
            <div>
              <span className="collection-kicker">
                PICK THE MOOD. MAKE IT YOURS.
              </span>
              <h2 id="catalogue-title">What kind of night is it?</h2>
            </div>
            <label className="collection-search">
              <Search size={17} />
              <input
                aria-label="Search activities"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find your kind of date…"
                type="search"
              />
            </label>
          </div>

          {/* Primary Category Buttons */}
          <div className="collection-filters" aria-label="Filter activities">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                aria-pressed={category === cat.id}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
                <span>
                  {
                    activities.filter(
                      (item) => cat.id === 'all' || item.category === cat.id,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>

          {/* Secondary Mood & Attribute Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '14px 0 20px' }}>
            {FILTER_TAGS.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`btn ${selectedTag === tag.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  borderRadius: '20px',
                  border: selectedTag === tag.id ? 'none' : '1px solid var(--line)',
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div className="collection-results" role="status">
            {visible.length}{' '}
            {visible.length === 1 ? 'experience' : 'experiences'} to share{' '}
            <span>Made for two, wherever you are.</span>
          </div>

          {/* Activities Cards Grid */}
          <div className="collection-grid">
            {visible.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={`collection-card collection-card--${item.category}`}
                onPointerMove={tilt}
                onPointerLeave={resetTilt}
                onBlur={() => {}}
                style={
                  { '--tilt-x': '0deg', '--tilt-y': '0deg' } as CSSProperties
                }
              >
                <div className="collection-card-stage">
                  <span className="collection-card-category">
                    {categories.find((cat) => cat.id === item.category)?.label}
                  </span>
                  <ObjectArt motif={item.motif} />
                  <span className="collection-card-number">
                    {String(activities.indexOf(item) + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="collection-card-copy">
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#796369' }}>
                      ⏱️ {item.duration}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#796369' }}>
                      🎁 {item.keepsake}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="collection-card-cta">
                    Let&apos;s do this <ArrowUpRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="collection-empty">
              <Heart size={30} />
              <h3>No dates found just yet.</h3>
              <p>Try another word, or explore the whole collection.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                  setSelectedTag('all');
                }}
              >
                Show all experiences
              </button>
            </div>
          )}
        </section>

        {/* Passport Banner */}
        <Link href="/passport" className="collection-passport">
          <div className="collection-mini-passport" aria-hidden="true">
            <span>DEARLY US</span>
            <Heart size={32} strokeWidth={1} />
            <b>PASSPORT</b>
          </div>
          <div>
            <span className="collection-kicker">
              THE BEST PART? KEEPING IT.
            </span>
            <h2>Your dates deserve a little history.</h2>
            <p>Collect stamps and memory notes in your shared Date Passport.</p>
          </div>
          <span className="collection-passport-link">
            Open your passport <ArrowUpRight size={20} />
          </span>
        </Link>

        <div className="collection-ending">
          <Sparkles size={17} />
          <p>No perfect plans needed. Just you two.</p>
          <Link href="/">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
