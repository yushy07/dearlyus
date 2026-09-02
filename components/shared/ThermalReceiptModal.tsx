'use client';

import React, { useEffect, useState } from 'react';
import { sounds } from '@/lib/sound';
import { DateReceiptData, downloadReceiptPNG } from '@/lib/receipt-canvas';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DateReceiptData;
}

export function ThermalReceiptModal({ isOpen, onClose, data }: ThermalReceiptModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Play thermal dot-matrix printing followed by paper tear
      sounds.playThermalPrinter();
      const tearTimer = setTimeout(() => {
        sounds.playPaperTear();
      }, 550);
      return () => clearTimeout(tearTimer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    sounds.playCelebration();
    downloadReceiptPNG(data);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const shareText = `🧾 Our Angie Date Lore Receipt!\nCompatibility: ${data.overallSync}%\nVerdict: ${data.hostVerdict}\nRoom: ${data.roomCode}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: 'rgba(12, 14, 18, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playPop();
          onClose();
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        {/* Recessed Thermal Printer Machine Slot */}
        <div
          style={{
            width: '340px',
            height: '18px',
            borderRadius: '10px 10px 0 0',
            background: 'linear-gradient(180deg, #1A1C22 0%, #0D0E12 100%)',
            border: '2px solid #2B2D36',
            borderBottom: 'none',
            boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.9), 0 -2px 10px rgba(0,0,0,0.4)',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Machine Feed Slot Slit */}
          <div
            style={{
              width: '280px',
              height: '4px',
              background: '#000000',
              borderRadius: '2px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
            }}
          />
        </div>

        {/* Rolling Thermal Paper Receipt */}
        <div
          style={{
            width: '320px',
            background: '#FAF8F5',
            color: '#222328',
            fontFamily: 'var(--font-mono), monospace',
            padding: '24px 20px 20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.05)',
            position: 'relative',
            maxHeight: '75vh',
            overflowY: 'auto',
            animation: 'slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            borderLeft: '1px solid #E5E0D6',
            borderRight: '1px solid #E5E0D6',
          }}
        >
          {/* Receipt Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #B8B5AB', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#6A6C75', textTransform: 'uppercase' }}>
              ✦ OFFICIAL DATE MEMORY ✦
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '6px 0 4px', letterSpacing: '0.5px' }}>
              ANGIE DATE NIGHT LORE
            </h3>
            <div style={{ fontSize: '11px', color: '#555761' }}>
              ROOM: #{data.roomCode} · {data.date}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>
              {data.partnerA.toUpperCase()} ♡ {data.partnerB.toUpperCase()}
            </div>
          </div>

          {/* Itemized Questions & Compatibility */}
          <div style={{ fontSize: '11px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderBottom: '1px dashed #B8B5AB', paddingBottom: '4px', marginBottom: '8px' }}>
              <span>LORE TOPIC</span>
              <span>SYNC</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '210px' }}>
                    <div style={{ fontWeight: 700, color: '#1B1C22' }}>
                      {item.number}. {item.topic}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#6C6E78', marginTop: '1px' }}>
                      {data.partnerA}: &quot;{item.answerA}&quot;
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: item.syncPercent === 100 ? '#059669' : '#D97706' }}>
                    {item.syncPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Compatibility Score & Verdict */}
          <div style={{ borderTop: '2px dashed #B8B5AB', paddingTop: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 900 }}>
              <span>TOTAL SYNC:</span>
              <span style={{ fontSize: '20px', color: '#E11D48' }}>{data.overallSync}%</span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#4B4D56', marginTop: '6px', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
              &quot;{data.hostVerdict}&quot;
            </div>
          </div>

          {/* Couple Signature Line */}
          <div style={{ borderTop: '1px dashed #B8B5AB', paddingTop: '10px', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '9.5px', color: '#888A94', textTransform: 'uppercase' }}>Validated Lifetime Keepsake</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: '#FF4D80', marginTop: '4px' }}>
              Signed: {data.partnerA} ♡ {data.partnerB}
            </div>
          </div>

          {/* Scannable Barcode SVG */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '32px' }}>
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3].map((w, i) => (
                <div key={i} style={{ width: `${w}px`, height: '100%', background: '#222328' }} />
              ))}
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#777A86' }}>
              *ANGIE-{data.roomCode}-DATE*
            </div>
          </div>

          {/* Jagged Zigzag Serrated Bottom Edge */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: 0,
              right: 0,
              height: '10px',
              background: 'radial-gradient(circle, transparent 5px, #FAF8F5 5px)',
              backgroundSize: '12px 10px',
              backgroundPosition: '0 -5px',
            }}
          />
        </div>

        {/* Action Controls Below Receipt */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', width: '320px' }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '12px',
              background: downloaded ? '#10B981' : 'linear-gradient(135deg, #FF7BA3, #FF9E64)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(255,123,163,0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{downloaded ? '✓' : '💾'}</span>
            <span>{downloaded ? 'Saved!' : 'Save PNG'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.playPop()}
            style={{
              padding: '11px 14px',
              borderRadius: '12px',
              background: '#25D366',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💬</span>
          </a>

          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            style={{
              padding: '11px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
