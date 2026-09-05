'use client';

import React, { useState } from 'react';
import type { RelationshipMilestone } from '@/lib/account';
import { sounds } from '@/lib/sound';

export interface RelationshipConstellationProps {
  milestones: RelationshipMilestone[];
  partnerA?: string;
  partnerB?: string;
}

interface StarNode {
  id: string;
  kind: string;
  title: string;
  desc: string;
  icon: string;
  cx: number;
  cy: number;
}

const CONSTELLATION_NODES: StarNode[] = [
  { id: 'first_connection', kind: 'space_created', title: 'First Star Connected', desc: 'When you two bonded your space', icon: '🌟', cx: 80, cy: 120 },
  { id: 'first_date_night', kind: 'room_created', title: 'First Date Spark', desc: 'First shared date night room', icon: '🕯️', cx: 180, cy: 70 },
  { id: 'first_quiz_match', kind: 'quiz_match', title: 'Telepathic Resonance', desc: 'First matched quiz response', icon: '💖', cx: 290, cy: 130 },
  { id: 'first_drawing', kind: 'drawing_saved', title: 'First Shared Canvas', desc: 'First completed drawing artwork', icon: '🎨', cx: 390, cy: 80 },
  { id: 'first_photostrip', kind: 'photostrip', title: 'Vintage Photostrip', desc: 'Captured your first photostrip together', icon: '📸', cx: 480, cy: 140 },
  { id: 'first_letter', kind: 'letter', title: 'Wax-Sealed Letter', desc: 'Sealed a tender long-distance letter', icon: '💌', cx: 580, cy: 90 },
  { id: 'starlight_horizon', kind: 'dates_milestone', title: 'Starlight Horizon', desc: 'Celebrated multiple date nights together', icon: '🌌', cx: 680, cy: 130 },
];

export function RelationshipConstellation({ milestones }: RelationshipConstellationProps) {
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null);

  const isUnlocked = (node: StarNode) => {
    // If we have any milestones matching kind or if milestones exist
    if (node.id === 'first_connection') return true; // Always unlocked if on Our Space
    const matching = milestones.find((m) => m.kind.toLowerCase().includes(node.kind) || node.kind.includes(m.kind.toLowerCase()));
    if (matching) return true;
    if (node.id === 'first_date_night' && milestones.length >= 1) return true;
    if (node.id === 'starlight_horizon' && milestones.length >= 3) return true;
    return false;
  };

  const getMilestoneDate = (node: StarNode) => {
    const matching = milestones.find((m) => m.kind.toLowerCase().includes(node.kind));
    if (matching?.occurredAt) {
      return new Date(matching.occurredAt).toLocaleDateString();
    }
    return 'Achieved ♡';
  };

  const unlockedCount = CONSTELLATION_NODES.filter(isUnlocked).length;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 60%, #31103F 100%)',
        borderRadius: '28px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 20px 50px -10px rgba(30, 27, 75, 0.4)',
        border: '1px solid rgba(244, 114, 182, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Constellation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#F472B6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            <span>✦</span> Relationship Constellation
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Our Starlight Milestones
          </h3>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#FDE047',
          }}
        >
          {unlockedCount} of {CONSTELLATION_NODES.length} Stars Shining
        </div>
      </div>

      <p style={{ fontSize: '13.5px', color: '#CBD5E1', maxWidth: '540px', margin: '0 0 16px', lineHeight: 1.5 }}>
        Every shared date night, quiz match, and sealed artwork lights another star in your personal sky.
      </p>

      {/* Alignment Progress Meter */}
      <div style={{ margin: '0 0 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
          <span>Constellation Alignment</span>
          <span style={{ color: '#FDE047' }}>{Math.round((unlockedCount / CONSTELLATION_NODES.length) * 100)}% Shining</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(unlockedCount / CONSTELLATION_NODES.length) * 100}%`,
              background: 'linear-gradient(90deg, #FF4E78, #FDE047)',
              borderRadius: '999px',
              boxShadow: '0 0 10px rgba(255, 78, 120, 0.6)',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* Interactive Constellation SVG Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '210px',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 760 210"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Ambient Twinkling Stars */}
          {[
            { cx: 50, cy: 30, r: 1.2, delay: '0s' },
            { cx: 120, cy: 170, r: 1.6, delay: '1s' },
            { cx: 230, cy: 40, r: 1.2, delay: '2s' },
            { cx: 340, cy: 180, r: 1.4, delay: '0.5s' },
            { cx: 460, cy: 25, r: 1.2, delay: '1.5s' },
            { cx: 540, cy: 190, r: 1.8, delay: '2.5s' },
            { cx: 640, cy: 35, r: 1.2, delay: '0.8s' },
            { cx: 720, cy: 170, r: 1.4, delay: '1.8s' },
          ].map((st, i) => (
            <circle
              key={i}
              cx={st.cx}
              cy={st.cy}
              r={st.r}
              fill="#FFFFFF"
              style={{
                animation: `starTwinkle 3s ease-in-out infinite alternate`,
                animationDelay: st.delay,
              }}
            />
          ))}

          {/* Lines between consecutive stars */}
          {CONSTELLATION_NODES.slice(0, -1).map((node, idx) => {
            const nextNode = CONSTELLATION_NODES[idx + 1];
            const bothActive = isUnlocked(node) && isUnlocked(nextNode);
            return (
              <line
                key={`line-${node.id}`}
                x1={node.cx}
                y1={node.cy}
                x2={nextNode.cx}
                y2={nextNode.cy}
                stroke={bothActive ? '#F43F5E' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={bothActive ? 2 : 1}
                strokeDasharray={bothActive ? 'none' : '4 4'}
                style={{
                  filter: bothActive ? 'drop-shadow(0 0 6px #F43F5E)' : 'none',
                  transition: 'all 0.4s ease',
                }}
              />
            );
          })}

          {/* Star Nodes */}
          {CONSTELLATION_NODES.map((node) => {
            const unlocked = isUnlocked(node);
            const isSelected = selectedStar?.id === node.id;
            return (
              <g
                key={node.id}
                onClick={() => {
                  try {
                    sounds.playSparkleReaction('✨');
                  } catch {}
                  setSelectedStar(node);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow ring if unlocked */}
                {unlocked && (
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={isSelected ? 20 : 16}
                    fill="none"
                    stroke="#F472B6"
                    strokeWidth={1.5}
                    opacity={0.6}
                    style={{ animation: 'together-pulse-ring 2.4s infinite ease-out' }}
                  />
                )}

                {/* Core Star Body */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={isSelected ? 14 : 11}
                  fill={unlocked ? '#F43F5E' : '#1E293B'}
                  stroke={unlocked ? '#FDE047' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={2}
                  style={{
                    filter: unlocked ? 'drop-shadow(0 0 8px #F43F5E)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                />

                {/* Text Label beneath star */}
                <text
                  x={node.cx}
                  y={node.cy + 24}
                  textAnchor="middle"
                  fill={unlocked ? '#FFFFFF' : '#64748B'}
                  fontSize="10"
                  fontWeight="700"
                  letterSpacing="0.02em"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.title.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Star Details Pill */}
        {selectedStar && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(244, 114, 182, 0.35)',
              borderRadius: '999px',
              padding: '6px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              animation: 'unfoldIn 0.25s ease',
            }}
          >
            <span>{selectedStar.icon}</span>
            <strong style={{ fontSize: '12.5px', color: '#FFFFFF' }}>{selectedStar.title}</strong>
            <span style={{ color: '#94A3B8', fontSize: '11.5px' }}>
              {isUnlocked(selectedStar) ? `· ${getMilestoneDate(selectedStar)}` : `· ${selectedStar.desc}`}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStar(null);
              }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0 2px' }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Starlight Milestones Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginTop: '18px',
        }}
      >
        {CONSTELLATION_NODES.map((node) => {
          const unlocked = isUnlocked(node);
          return (
            <div
              key={`card-${node.id}`}
              onClick={() => {
                try {
                  sounds.playSparkleReaction('✨');
                } catch {}
                setSelectedStar(node);
              }}
              style={{
                background: unlocked ? 'rgba(255, 78, 120, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: unlocked ? '1px solid rgba(244, 114, 182, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{node.icon}</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: unlocked ? '#FDE047' : '#64748B',
                  }}
                >
                  {unlocked ? 'SHINING ✦' : 'AWAITING'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: unlocked ? '#FFFFFF' : '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {node.title}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#64748B',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {unlocked ? getMilestoneDate(node) : node.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
