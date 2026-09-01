'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPostBySlug, BLOG_POSTS } from '@/data';
import { Ribbon, Navbar } from '@/components/shared';

export default function BlogPostPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'ldr-online-date-ideas';
  const post = getPostBySlug(slug) || BLOG_POSTS['ldr-online-date-ideas'];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px', color: 'var(--ink)' }}>
      {/* Ribbon */}
      <Ribbon text={<>📖 Angie Blog · <b>Stories, Science &amp; Date Ideas for Long Distance Love</b></>} />

      {/* Top Navbar */}
      <Navbar
        rightAction={
          <Link className="btn btn-ghost" href="/blog" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ← All Articles
          </Link>
        }
      />

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
