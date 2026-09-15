'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpen, Camera, Clock3, Heart, Sparkles } from 'lucide-react';
import { getAllPosts } from '@/data';
import { Navbar, Ribbon } from '@/components/shared';
import { ScrollStack, ScrollStackItem } from '@/components/motion';
import { FoldText } from '@/components/ui';
import styles from './blog.module.css';

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <div className={styles.page}>
      <Ribbon text={<><span>THE DEARLY US JOURNAL</span><b>Notes for loving well across the miles</b></>} />
      <Navbar rightAction={<Link href="/photobooth" className={styles.navAction}>Make a memory <Camera size={15} /></Link>} />
      <main>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}><Heart size={14} /> FIELD NOTES FOR TWO</span>
            <h1><FoldText text={'A quieter corner for\nlong-distance love.'} splitBy="line" hinge="top" trigger="mount" duration={0.7} stagger={0.11} /></h1>
            <p>Thoughtful guides, honest stories and date ideas written for the ordinary work of staying close when you cannot share the same room.</p>
            <div className={styles.heroDetails}>
              <span><BookOpen size={15} /> Practical, personal reading</span>
              <span><Sparkles size={15} /> Made for two people</span>
            </div>
          </div>
          <div className={styles.heroStillLife} aria-hidden="true">
            <span className={styles.thread} />
            <span className={styles.postcard}>wish you<br />were here.</span>
            <span className={styles.photo}><img src={posts[0]?.image} alt="" /></span>
            <span className={styles.pressedFlower}>❧</span>
          </div>
        </header>

        <section className={styles.issue} aria-labelledby="journal-heading">
          <div className={styles.issueHeading}>
            <div><span className={styles.kicker}>ISSUE NO. 01 · READ SLOWLY</span><h2 id="journal-heading">Stories worth keeping open.</h2></div>
            <p>Each note is short enough for tonight and thoughtful enough to send to your person afterward.</p>
          </div>
          <ScrollStack className={styles.storyStack} itemDistance={105} itemStackDistance={22} baseScale={0.91} itemScale={0.025} rotationAmount={0.22}>
            {posts.map((post, index) => (
              <ScrollStackItem key={post.slug} itemClassName={styles.storyCard}>
                <Link href={`/blog/${post.slug}`} className={styles.storyLink}>
                  <div className={styles.storyImage}><img src={post.image} alt="" /><span>{String(index + 1).padStart(2, '0')}</span></div>
                  <div className={styles.storyBody}>
                    <div className={styles.storyMeta}><span>{post.category}</span><span><Clock3 size={13} /> {post.readTime}</span></div>
                    <h3>{post.title}</h3><p>{post.summary}</p>
                    <span className={styles.readLink}>Read the note <ArrowUpRight size={17} /></span>
                  </div>
                </Link>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </section>
        <section className={styles.closingNote}>
          <span aria-hidden="true">♡</span><div><p>FOR THE NEXT QUIET NIGHT</p><h2>Turn something you read into time together.</h2></div>
          <Link href="/activity">Choose an activity <ArrowUpRight size={17} /></Link>
        </section>
      </main>
    </div>
  );
}
