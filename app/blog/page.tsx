'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getAllPosts } from '@/data';
import { BlogPostData } from '@/types';
import { Ribbon, Navbar } from '@/components/shared';

export default function BlogPage() {
  const posts = getAllPosts();
  const [selectedPost, setSelectedPost] = useState<BlogPostData | null>(null);

  return (
    <div style={{ background: '#FFFBF6', minHeight: '100vh', color: '#23242A', paddingBottom: '80px' }}>
      <Ribbon text={<>📖 Angie Stories &amp; Guides · <b>Research, Advice &amp; Ideas for Long Distance Love</b></>} />

      <Navbar
        rightAction={
          <Link href="/photobooth" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
            Open Photobooth 📸
          </Link>
        }
      />

      <main className="wrap" style={{ paddingTop: '40px', maxWidth: '860px' }}>
        {!selectedPost ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span className="eyebrow" style={{ color: '#C9829C' }}>
                Long Distance Advice &amp; Stories
              </span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, margin: '12px 0' }}>
                Stories, science, and ideas for people loving across borders.
              </h1>
              <p style={{ color: '#6B6C76', fontSize: '17px', maxWidth: '52ch', margin: '0 auto' }}>
                Written by two people who spent two years in an LDR between Canada and Indonesia, plus researchers and couples in our community.
              </p>
            </div>

            {/* Posts Grid */}
            <div style={{ display: 'grid', gap: '28px' }}>
              {posts.map((post) => (
                <div
                  key={post.slug}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E7E1D8',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
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
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#23242A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Quick preview ▷
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: '12.5px', color: 'var(--pink)', fontWeight: 700, textDecoration: 'underline' }}
                      >
                        Full page article ↗
                      </Link>
                    </div>
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
