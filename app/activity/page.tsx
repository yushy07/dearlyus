'use client';

import { useState, type PointerEvent, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, Heart, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/shared';
import { useCoupleProfile } from '@/lib/couple';
import './activity-collection.css';
import { ActivityIllustration } from './ActivityIllustration';

type Category = 'all' | 'play' | 'talk' | 'make' | 'distance';
const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All experiences' },
  { id: 'play', label: 'A little competition' },
  { id: 'talk', label: 'Closer conversations' },
  { id: 'make', label: 'Make a memory' },
  { id: 'distance', label: 'Across the miles' },
];
const activities: {
  href: string;
  title: string;
  description: string;
  category: Exclude<Category, 'all'>;
  motif: string;
}[] = [
  {
    href: '/photobooth',
    title: 'The Photobooth',
    description: 'A shared countdown. A strip of little moments to keep.',
    category: 'make',
    motif: 'photo',
  },
  {
    href: '/quiz',
    title: 'Know Me Quiz',
    description: 'You know their coffee order. What about their secret dream?',
    category: 'talk',
    motif: 'quiz',
  },
  {
    href: '/letter',
    title: 'Letters to the Future',
    description: 'A little of today, sealed for the two of you tomorrow.',
    category: 'make',
    motif: 'letter',
  },
  {
    href: '/dare',
    title: 'Truth or Dare',
    description: 'A brave answer or a playful dare. Your move.',
    category: 'play',
    motif: 'dice',
  },
  {
    href: '/cards',
    title: 'Honest Cards',
    description: 'Make room for the conversations you rarely get to have.',
    category: 'talk',
    motif: 'cards',
  },
  {
    href: '/host',
    title: 'Date Host',
    description: 'Let a friendly third wheel get the conversation going.',
    category: 'talk',
    motif: 'host',
  },
  {
    href: '/arcade',
    title: 'The Arcade',
    description: 'Tiny games. Big rematches. One very smug winner.',
    category: 'play',
    motif: 'arcade',
  },
  {
    href: '/scrapbook',
    title: 'Digital Scrapbook',
    description: 'Tape down your photos and write around the edges.',
    category: 'make',
    motif: 'scrapbook',
  },
  {
    href: '/match',
    title: 'Love Match',
    description: 'Find the unexpected places your personalities meet.',
    category: 'talk',
    motif: 'match',
  },
  {
    href: '/iq',
    title: 'IQ Duel',
    description: 'The same questions. Two wonderfully competitive minds.',
    category: 'play',
    motif: 'iq',
  },
  {
    href: '/riddle',
    title: 'Riddle Night',
    description: 'Put your heads together and follow the clues.',
    category: 'play',
    motif: 'riddle',
  },
  {
    href: '/lab',
    title: 'The Lab',
    description: 'A little science, a little teamwork, a new challenge.',
    category: 'play',
    motif: 'lab',
  },
  {
    href: '/debate',
    title: 'The Great Debate',
    description: 'Pick a side and make your most convincing case.',
    category: 'talk',
    motif: 'debate',
  },
  {
    href: '/court',
    title: 'Couples Court',
    description: 'Bring your most harmless dispute before the court.',
    category: 'play',
    motif: 'court',
  },
  {
    href: '/draw',
    title: 'Draw Together',
    description: 'Two canvases and one prompt. Artistic talent optional.',
    category: 'make',
    motif: 'draw',
  },
  {
    href: '/hunt',
    title: 'Snap Hunt',
    description: 'Find it, photograph it, and race back with your discovery.',
    category: 'play',
    motif: 'hunt',
  },
  {
    href: '/future',
    title: 'Our Future',
    description: 'Give your someday a place to start taking shape.',
    category: 'make',
    motif: 'future',
  },
  {
    href: '/birthday',
    title: 'Birthday Gift',
    description: 'Make a small surprise that feels entirely like them.',
    category: 'make',
    motif: 'birthday',
  },
  {
    href: '/fashion',
    title: 'Fashion Show',
    description: 'One brief. Two looks. Time for your runway moment.',
    category: 'play',
    motif: 'fashion',
  },
  {
    href: '/shirts',
    title: 'Matching Shirts',
    description: 'Create something that says we belong together.',
    category: 'make',
    motif: 'shirts',
  },
  {
    href: '/forecast',
    title: 'Love Forecast',
    description: 'A little romantic weather report for your day.',
    category: 'distance',
    motif: 'forecast',
  },
  {
    href: '/timezone',
    title: 'Timezone & Reunion',
    description: 'Find your shared hours and count down to the next hello.',
    category: 'distance',
    motif: 'timezone',
  },
  {
    href: '/bucket',
    title: '100 Dates Bucket List',
    description: 'Collect firsts, small adventures, and someday plans.',
    category: 'distance',
    motif: 'bucket',
  },
  {
    href: '/date',
    title: 'Date Night Planner',
    description: 'Turn what should we do into a lovely little evening.',
    category: 'distance',
    motif: 'date',
  },
];

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
  const [query, setQuery] = useState('');
  const visible = activities.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="activity-collection">
      <Navbar />
      <main className="collection-main">
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
          <div className="collection-results" role="status">
            {visible.length}{' '}
            {visible.length === 1 ? 'experience' : 'experiences'} to share{' '}
            <span>Made for two, wherever you are.</span>
          </div>
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
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="collection-card-cta">
                    Let's do this <ArrowUpRight size={17} />
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
                }}
              >
                Show all experiences
              </button>
            </div>
          )}
        </section>
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
