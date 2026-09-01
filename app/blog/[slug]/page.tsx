'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface BlogPostData {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  author: string;
  content: string[];
  relatedActivities: { title: string; href: string; icon: string }[];
}

const POST_DATABASE: Record<string, BlogPostData> = {
  'ldr-online-date-ideas': {
    slug: 'ldr-online-date-ideas',
    category: 'Date Night Guides',
    readTime: '6 min read',
    title: '7 fun LDR online dates that aren’t watching Netflix',
    summary: 'Active, shared things to do instead of another muted stream — a synced photobooth, the same recipe in two kitchens, brain-teaser duels, a joint vision board.',
    image: '/august/hero.webp',
    date: 'August 14, 2026',
    author: 'Mia & Alex (Angie Founders)',
    content: [
      'When you are in a long distance relationship, default video calls often degenerate into “How was your day?” “Good, yours?” within five minutes. Watching a movie on parallel streams can easily feel passive and quiet.',
      'Active dates require both of you to make decisions, banter, create, and tease each other in real-time. Here are 7 date formats that transformed our relationship across 10,840 kilometers:',
      '1. The Synchronized Online Photobooth: Rather than taking another awkward screenshot, join Angie’s photobooth. A shared 3..2..1 countdown snaps both of your webcams simultaneously, generating a classic Korean 인생네컷 4-cut photostrip you can stick to your real-life fridge.',
      '2. Two Kitchens, One Recipe: Pick a challenging dish neither of you has cooked (like handmade gnocchi or Japanese matcha soufflé). Prop your laptops on the counter, set a kitchen timer, and plate your dishes together.',
      '3. Double-Blind Couples Quiz: Use the Know Me Quiz on Angie. The double-blind lock-in mechanism means neither person can peek until both hit lock-in, guaranteeing unfiltered authenticity.',
      '4. Joint Digital Vision Board: In Our Future, drag and drop floorplans, dream vacations, pets, and wedding rings on a shared infinite canvas.',
      '5. Rapid-Fire Trivia & Brain Duels: Test your speed in IQ Duel and Riddle Night for lively, competitive banter.',
      '6. Honest Question Decks: Pull cards from Honest Cards late at night for questions that bypass small talk.',
      '7. Multi-Year Time Capsules: Write Letters to the Future to be unlocked on your next anniversary or the day you close the distance.',
    ],
    relatedActivities: [
      { title: 'Online Photobooth', href: '/photobooth', icon: '📸' },
      { title: 'Couples Quiz', href: '/quiz', icon: '❓' },
      { title: 'Our Future Board', href: '/future', icon: '🏡' },
    ],
  },
  'most-played-games': {
    slug: 'most-played-games',
    category: 'Inside the numbers',
    readTime: '5 min read',
    title: '3 games that saved our long distance relationship',
    summary: 'The three most-played games on Angie — a quiz that never repeats a question, a live shared sketchpad, and an arcade that puts your face in the game.',
    image: '/photos/quiz-duo.webp',
    date: 'July 28, 2026',
    author: 'Alex (Angie Team)',
    content: [
      'Over 50,000 dates have been hosted on Angie. Looking at the data, three activities consistently account for over 65% of all active time spent on the platform.',
      'First is the Know Me Quiz. What makes it addictive is the double-blind lock-in mechanism: you cannot see your partner’s choice until both click submit, avoiding any peeking.',
      'Second is Draw Together: a shared canvas where latency is eliminated and you watch strokes appear live as you guess silly prompts.',
      'Third is the Online Photobooth: giving long distance couples a tangible 인생네컷 photo strip to hold onto in real life.',
    ],
    relatedActivities: [
      { title: 'Couples Quiz', href: '/quiz', icon: '❓' },
      { title: 'Draw Together', href: '/draw', icon: '🎨' },
      { title: 'Face Arcade', href: '/arcade', icon: '🕹️' },
    ],
  },
  'photobooth-tutorial': {
    slug: 'photobooth-tutorial',
    category: 'Tutorial',
    readTime: '5 min read',
    title: 'How to use our online photobooth for couple keepsakes',
    summary: 'Six steps from a room code to a strip you both took at the same second — with theme packs and backdrops laid out so you can try them here first.',
    image: '/august/c-booth.webp',
    date: 'June 19, 2026',
    author: 'Mia (Angie Team)',
    content: [
      'Traditional video call screenshots are blurry, awkward, and usually show one person looking away. Angie’s online photobooth was engineered specifically to solve this problem.',
      'Step 1: Open the photobooth and create a 5-letter room code (e.g. KX7RM).',
      'Step 2: Share the link with your partner so both devices sync their video feeds side-by-side.',
      'Step 3: Choose your room style — Vintage 1930s Automat with velvet curtains, Classic White 인생네컷, or Neon Karaoke.',
      'Step 4: Enable AR face filters (blush hearts, cat ears, or soft sparkle glow).',
      'Step 5: Hit Take Photos. The synchronized 3..2..1 countdown captures 4 consecutive shots with screen flashes.',
      'Step 6: Decorate with cute stickers, write your couple names, and export the high-res 600x1600 PNG or order twin fridge magnets.',
    ],
    relatedActivities: [
      { title: 'Enter Photobooth Studio', href: '/photobooth', icon: '📸' },
      { title: 'Keepsakes Shop', href: '/shop', icon: '🧲' },
    ],
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'ldr-online-date-ideas';
  const post = POST_DATABASE[slug] || POST_DATABASE['ldr-online-date-ideas'];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <div className="ribbon">
        <span className="ribbon-in">
          📖 Angie Blog · <b>Stories, Science &amp; Date Ideas for Long Distance Love</b>
        </span>
      </div>

      {/* Top Navbar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link className="btn btn-ghost" href="/blog" style={{ padding: '6px 12px', fontSize: '13px' }}>
              ← All Articles
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '40px', maxWidth: '780px' }}>
        {/* Article Meta Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <span className="badge hot">{post.category}</span>
            <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              {post.readTime} · {post.date}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '16px' }}>
            {post.title}
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
            {post.summary}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pink)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '12px' }}>
              A
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{post.author}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Long Distance Relationship Research</div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div style={{ width: '100%', height: '360px', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Article Body */}
        <article className="booth-box" style={{ padding: '36px 32px', lineHeight: 1.8, fontSize: '16px' }}>
          {post.content.map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '20px' }}>
              {paragraph}
            </p>
          ))}
        </article>

        {/* Related Date Activities Bar */}
        <div style={{ marginTop: '36px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Try These Activities from the Article</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {post.relatedActivities.map((act, i) => (
              <Link
                key={i}
                href={act.href}
                className="booth-box"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.15s ease',
                }}
              >
                <span style={{ fontSize: '28px' }}>{act.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>{act.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--pink)', fontWeight: 700 }}>Launch Free ▷</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
