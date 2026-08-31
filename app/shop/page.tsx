'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  badge?: string;
  description: string;
  features: string[];
  image: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'magnet',
    name: 'Die-Cut Fridge Magnet',
    price: 12,
    badge: '★ Best Seller',
    description: 'High-gloss vinyl magnet cut to the exact shape of your Angie photostrip. Sticks cleanly to any fridge.',
    features: ['Waterproof & UV resistant finish', 'Strong magnetic backing', 'Ships in twin packs (one for each home)'],
    image: '🧲',
  },
  {
    id: 'frame',
    name: 'Matte Black Framed Strip',
    price: 34,
    badge: 'Keepsake',
    description: 'Solid wood frame with museum-grade glass and archival photographic print of your 4-cut session.',
    features: ['Real wood construction with easel stand', 'Glare-resistant protective glass', 'Gift box included'],
    image: '🖼️',
  },
  {
    id: 'case',
    name: 'Slim Couple iPhone Case',
    price: 37,
    description: 'Your favorite photobooth strip embedded inside shock-absorbing dual-layer protective case.',
    features: ['Compatible with MagSafe', 'Drop tested up to 6 feet', 'Available for iPhone 13, 14, 15, 16 series'],
    image: '📱',
  },
  {
    id: 'shirts',
    name: 'Matching Couple Tee Set',
    price: 42,
    badge: 'Studio',
    description: 'Two ultra-soft 100% organic cotton shirts printed with your custom photostrip and coordinates.',
    features: ['100% Ring-spun heavyweight cotton', 'Pre-shrunk comfortable fit', 'Custom Calgary & Jakarta print'],
    image: '👕',
  },
];

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [dualShipping, setDualShipping] = useState(true);
  const [address1, setAddress1] = useState('Calgary, AB, Canada');
  const [address2, setAddress2] = useState('Jakarta Selatan, Indonesia');
  const [ordered, setOrdered] = useState(false);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setOrdered(true);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/">
            angie
            <span className="dots">
              <i className="p"></i>
              <i className="b"></i>
            </span>
          </Link>
          <nav>
            <Link href="/photobooth">Photobooth</Link>
            <Link href="/activity">Activities</Link>
            <Link className="btn btn-grad" href="/photobooth">
              Take New Strip 📸
            </Link>
          </nav>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '36px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
          <span className="eyebrow">Angie Print Shop · Ships Worldwide</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', marginBottom: '12px' }}>
            Turn your digital strips into <span className="grad">real keepsakes</span>.
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px' }}>
            One single order can split and ship to both of your addresses anywhere in the world.
          </p>
        </div>

        {!ordered ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
              gap: '40px',
              alignItems: 'start',
            }}
          >
            {/* Products Grid */}
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {PRODUCTS.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    style={{
                      background: selectedProduct.id === prod.id ? '#FFFFFF' : 'var(--paper-raised)',
                      border: selectedProduct.id === prod.id ? '2px solid var(--pink)' : '1px solid var(--line)',
                      borderRadius: '14px',
                      padding: '20px',
                      cursor: 'pointer',
                      boxShadow: selectedProduct.id === prod.id ? 'var(--shadow-lg)' : 'var(--shadow-soft)',
                      transform: selectedProduct.id === prod.id ? 'scale(1.02)' : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {prod.badge && (
                      <span className="badge hot" style={{ position: 'absolute', top: '14px', right: '14px' }}>
                        {prod.badge}
                      </span>
                    )}
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>{prod.image}</div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>{prod.name}</h3>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink)' }}>${prod.price} USD</div>
                  </div>
                ))}
              </div>

              {/* Product Details Panel */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{selectedProduct.image}</span>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedProduct.name}</h2>
                    <div style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>${selectedProduct.price} USD each</div>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.5, marginBottom: '16px' }}>
                  {selectedProduct.description}
                </p>
                {selectedProduct.id === 'magnet' && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--line)', maxHeight: '200px' }}>
                    <img src="/photos/magnet-fridge.webp" alt="Fridge magnet on door" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <ul style={{ listStyle: 'none', display: 'grid', gap: '8px', padding: 0 }}>
                  {selectedProduct.features.map((feat, i) => (
                    <li key={i} style={{ fontSize: '14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--pink)', fontWeight: 800 }}>♡</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Checkout Form */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '18px' }}>Order Details</h3>

              <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Select Photostrip
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option>Today&apos;s Session (Room KX7RM) · Calgary ♡ Jakarta</option>
                    <option>Sunset Terrace Strip · 4-Cut</option>
                    <option>Upload custom photo strip</option>
                  </select>
                </div>

                {/* Dual Shipping Toggle */}
                <div
                  style={{
                    background: 'var(--paper)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={dualShipping}
                      onChange={(e) => setDualShipping(e.target.checked)}
                      style={{ accentColor: 'var(--pink)', width: '18px', height: '18px' }}
                    />
                    Split delivery: Ship to BOTH our addresses
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '4px 0 0 26px' }}>
                    We automatically print 2 copies and package one for each partner.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Partner A Address (e.g. You)
                  </label>
                  <input
                    type="text"
                    required
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {dualShipping && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Partner B Address (e.g. Partner)
                    </label>
                    <input
                      type="text"
                      required
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    defaultValue="mia@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Price Summary */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                    <span>{selectedProduct.name} {dualShipping ? '(Twin Pack)' : '(Single)'}</span>
                    <span>${dualShipping ? selectedProduct.price * 2 : selectedProduct.price} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#0a7d4d' }}>
                    <span>Worldwide Tracked Shipping</span>
                    <span>Free Today</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                    <span>Total</span>
                    <span>${dualShipping ? selectedProduct.price * 2 : selectedProduct.price} USD</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-grad" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}>
                  Order Keepsakes ▷
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Order Success */
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '48px 28px',
              maxWidth: '560px',
              margin: '0 auto',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Order Placed With Love!</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '16px', marginBottom: '24px' }}>
              We are printing your {selectedProduct.name} and sending packages to:
              <br />
              <b>{address1}</b> &amp; <b>{address2}</b>.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setOrdered(false)}>
                Order Another Print
              </button>
              <Link className="btn btn-primary" href="/photobooth">
                Back to Photobooth 📸
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
