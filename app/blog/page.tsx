'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  image: string;
  content: string[];
}

const POSTS: BlogPost[] = [
  {
    slug: 'ldr-online-date-ideas',
    category: 'Date night',
    readTime: '6 min',
    title: '7 fun LDR online dates that aren’t watching Netflix',
    summary:
      'Active, shared things to do instead of another muted stream — a synced photobooth, the same recipe in two kitchens, brain-teaser duels, a joint vision board.',
    image: '/august/hero.webp',
    content: [
      'When you are in a long distance relationship, default video calls often degenerate into “How was your day?” “Good, yours?” within five minutes. Watching a movie on parallel streams can easily feel passive and quiet.',
      'Here are 7 active date ideas that bring authentic energy, banter, and memories:',
      '1. Synced Online Photobooth: Fire a 4-shot photostrip at the exact same second using Angie. Print the resulting strip as fridge magnets for both your apartments.',
      '2. The Same Recipe in Two Kitchens: Choose a dish neither of you has cooked before. Set your laptops on the counter, pour some wine, and taste-test your results on camera together.',
      '3. Know Me Quiz & Compatibility Duels: Lock in answers secretly and reveal them simultaneously to see who knows who best.',
      '4. Joint Digital Vision Board: Use our Our Future activity to drag and drop dream vacations, pets, house floorplans, and savings goals on a shared canvas.',
      '5. Riddle Night & Study Lab: Turn late night work sessions into cooperative brain challenges.',
      '6. Honest Question Decks: Go beyond surface chatter with deep vulnerability cards.',
      '7. Time Capsule Letters: Write letters to the two of you five years from now and seal them.',
    ],
  },
  {
    slug: 'most-played-games',
    category: 'Inside the numbers',
    readTime: '5 min',
    title: '3 games that saved our long distance relationship',
    summary:
      'The three most-played games on Angie — a quiz that never repeats a question, a live shared sketchpad, and an arcade that puts your face in the game.',
    image: '/photos/quiz-duo.webp',
    content: [
      'Two years into our LDR between Canada and Indonesia, we started building tiny games to keep our evenings lively. Over 50,000 dates later, three activities consistently top the leaderboard:',
      'First is the Know Me Quiz. What makes it addictive is the double-blind lock-in mechanism: you cannot see your partner’s choice until both click submit, avoiding any peeking.',
      'Second is Draw Together: a shared canvas where latency is eliminated and you watch strokes appear live as you guess silly prompts.',
      'Third is the Online Photobooth: giving long distance couples a tangible 인생네컷 photo strip to hold onto in real life.',
    ],
  },
  {
    slug: 'photobooth-tutorial',
    category: 'Tutorial',
    readTime: '5 min',
    title: 'How to use our online photobooth',
    summary:
      'Six steps from a room code to a strip you both took at the same second — with the theme packs and backdrops laid out so you can try them here first.',
    image: '/august/c-booth.webp',
    content: [
      '1. Open a Room: Visit getangie.com/photobooth and click Start Session. A unique 5-letter code is generated.',
      '2. Share the Link: Send the room link or code to your partner on WhatsApp or iMessage. They join with one tap on phone or laptop.',
      '3. Pick Your Theme: Choose between Korean Classic White, Sunset Glow, Vintage Sepia Film, or Cyber Neon.',
      '4. Follow the 4 Poses: The photobooth gives funny, romantic prompts for each shot with a 3-2-1 synchronized countdown.',
      '5. Add Stickers & Custom Names: Decorate your photo strip with hearts, sparkles, and anniversary stamps.',
      '6. Download & Print: Save the high-res PNG to your camera roll or ship matching fridge magnets to both homes.',
    ],
  },
];

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <div style={{ background: '#FFFBF6', minHeight: '100vh', color: '#23242A', paddingBottom: '80px' }}>
      {/* Editorial Header */}
      <header
        style={{
          borderBottom: '1px solid #E7E1D8',
          background: 'rgba(255, 251, 246, 0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '66px' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700 }}>
            get<span style={{ color: '#C9829C' }}>Angie</span>
          </Link>
          <nav style={{ display: 'flex', gap: '22px', alignItems: 'center', fontSize: '14px', fontWeight: 600 }}>
            <Link href="/blog" style={{ color: '#23242A' }}>
              Blog
            </Link>
            <Link href="/activity" style={{ color: '#6B6C76' }}>
              Activities
            </Link>
            <Link href="/photobooth" className="btn" style={{ background: '#23242A', color: '#fff', padding: '8px 16px', fontSize: '13px' }}>
              Open the booth
            </Link>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '50px' }}>
        {!selectedPost ? (
          <>
            {/* Hero */}
            <div style={{ maxWidth: '640px', marginBottom: '50px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#C9829C', fontWeight: 700 }}>
                The Angie blog
              </span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.1, margin: '14px 0 16px' }}>
                Things to do when you’re <em>apart</em>
              </h1>
              <p style={{ color: '#6B6C76', fontSize: '18px', lineHeight: 1.6 }}>
                Date ideas, guides, and the occasional look at what couples on Angie actually play. Written for the
                evenings when “how was your day?” has already run out.
              </p>
            </div>

            {/* Articles List */}
            <div style={{ display: 'grid', gap: '28px', maxWidth: '860px' }}>
              {POSTS.map((post, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: '28px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E1D8',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-soft)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ background: '#F6EDE6', height: '100%', minHeight: '200px' }}>
                    <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '24px 24px 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: '#C9829C', fontWeight: 700 }}>
                      {post.category} · {post.readTime}
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
                      {post.title}
                    </h2>
                    <p style={{ color: '#6B6C76', fontSize: '15px', lineHeight: 1.5, margin: 0 }}>{post.summary}</p>
                    <span style={{ marginTop: 'auto', fontWeight: 700, fontSize: '14px', color: '#23242A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Read it ▷
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Single Article Reader */
          <div style={{ maxWidth: '720px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E7E1D8', borderRadius: '16px', padding: '40px 36px' }}>
            <button
              onClick={() => setSelectedPost(null)}
              style={{ border: 'none', background: 'none', color: '#C9829C', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px' }}
            >
              ← Back to all posts
            </button>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', textTransform: 'uppercase', color: '#C9829C', fontWeight: 700, marginBottom: '8px' }}>
              {selectedPost.category} · {selectedPost.readTime}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', lineHeight: 1.15, marginBottom: '20px' }}>
              {selectedPost.title}
            </h1>
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
              <img src={selectedPost.image} alt={selectedPost.title} style={{ width: '100%', height: 'auto' }} />
            </div>
            <div style={{ display: 'grid', gap: '16px', fontSize: '16.5px', lineHeight: 1.7, color: '#3A3B45' }}>
              {selectedPost.content.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #E7E1D8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/photobooth" className="btn btn-grad">
                Open Online Photobooth 📸
              </Link>
              <button className="btn btn-ghost" onClick={() => setSelectedPost(null)}>
                Back to Blog
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
