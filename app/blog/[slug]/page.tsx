'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPostBySlug, BLOG_POSTS } from '@/data';
import { Navbar } from '@/components/shared';
import styles from './article.module.css';

export default function BlogPostPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'ldr-online-date-ideas';
  const post = getPostBySlug(slug) || BLOG_POSTS['ldr-online-date-ideas'];
  return (
    <div className={styles.page}>
      <Navbar rightAction={<Link className={styles.backLink} href="/blog">Back to the journal</Link>} />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.kicker}><span>{post.category}</span><span>{post.readTime}</span><span>{post.date}</span></div>
          <h1>{post.title}</h1>
          <p className={styles.summary}>{post.summary}</p>
          <div className={styles.byline}><span className={styles.authorMark}>du</span><span><strong>{post.author}</strong><small>Notes for loving across the miles</small></span></div>
        </header>
        <figure className={styles.hero}><img src={post.image} alt={post.title} /><figcaption>A field note from the Dearly Us journal</figcaption></figure>
        <div className={styles.readingLayout}>
          <aside className={styles.marginNote} aria-label="Journal note"><span>KEEP THIS CLOSE</span><p>Distance changes the ritual, never the care behind it.</p></aside>
          <article className={styles.article}>{post.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>
        </div>
        <section className={styles.activities}>
          <div className={styles.sectionHeading}><span>FROM READING TO TOGETHER</span><h2>Turn this note into a shared moment.</h2></div>
          <div className={styles.activityGrid}>{post.relatedActivities.map((activity) => (
            <Link key={activity.href} href={activity.href} className={styles.activityCard}><span className={styles.activityIcon}>{activity.icon}</span><span><strong>{activity.title}</strong><small>Open this activity</small></span><i aria-hidden="true">↗</i></Link>
          ))}</div>
        </section>
      </main>
    </div>
  );
}
