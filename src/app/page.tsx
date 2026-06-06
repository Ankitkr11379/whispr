import Link from 'next/link';

// ─── Data ─────────────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    icon: '🎭',
    title: 'Match Anonymously',
    desc: 'Start by answering deep prompts about your values, humor, and passions. Our AI finds matches that resonate with yours.',
    color: '#e8404a',
  },
  {
    icon: '🔍',
    title: 'Discover Their Vibe',
    desc: 'Chat without the pressure of aesthetics. Share voice notes, music, and ideas. Build a true picture before the first look.',
    color: '#27ae60',
  },
  {
    icon: '✨',
    title: 'Reveal When Ready',
    desc: 'Once a connection is established, decide together what to reveal your photos. A surprise that feels authentic and meaningful.',
    color: '#2980b9',
  },
];

const COMPARISON = [
  { feature: 'First Impression', whispr: 'Genuine Values', others: 'Physical Appearance' },
  { feature: 'Engagement', whispr: 'Deep Conversations', others: 'Ghosting & Burnout' },
  { feature: 'Match Quality', whispr: 'High Compatibility', others: 'Random Proximity' },
  { feature: 'Safety', whispr: 'Anonymity First', others: 'Immediate Exposure' },
];

const TESTIMONIALS = [
  {
    quote: '"I never thought I\'d find someone who quotes the same niche movies as me before we even saw each other\'s faces. Things changed dating for me."',
    name: 'Jordan, 22',
    role: 'New York, USA',
    initials: 'JO',
  },
  {
    quote: '"The \'Reveal When Ready\' feature is genius. We talked for two weeks before the reveal, and by then, the appearance was just the cherry on top."',
    name: 'Luis, 25',
    role: 'Lisbon',
    initials: 'LU',
  },
  {
    quote: '"As an introvert, typical apps were exhausting. Whispr lets me be myself without the pressure of performing for a camera."',
    name: 'Maya, 23',
    role: 'Berlin',
    initials: 'MA',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .wp-root {
          font-family: 'DM Sans', sans-serif;
          background: #fff8f5;
          color: #1a1a1a;
          min-height: 100vh;
        }

        /* ── NAV ── */
        .wp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,248,245,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(230,160,140,0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 60px;
        }

        .wp-nav-logo {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8404a;
          letter-spacing: -0.02em;
          text-decoration: none;
        }

        .wp-nav-cta {
          background: #e8404a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.1rem;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }

        .wp-nav-cta:hover { background: #d43840; transform: translateY(-1px); }

        /* ── HERO ── */
        .wp-hero {
          max-width: 1100px;
          margin: 0 auto;
          padding: 5rem 2rem 4rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }

        .wp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fff0ee;
          border: 1px solid #fdc5bb;
          border-radius: 20px;
          padding: 0.3rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #e8404a;
          margin-bottom: 1.25rem;
        }

        .wp-hero h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          margin-bottom: 1.25rem;
        }

        .wp-hero h1 em {
          font-style: italic;
          color: #e8404a;
        }

        .wp-hero-desc {
          font-size: 1rem;
          color: #666;
          line-height: 1.65;
          margin-bottom: 2rem;
          max-width: 420px;
        }

        .wp-hero-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

        .btn-primary-hero {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #e8404a;
          color: #fff;
          border-radius: 50px;
          padding: 0.8rem 1.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 16px rgba(232,64,74,0.3);
        }

        .btn-primary-hero:hover { background: #d43840; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,64,74,0.4); }

        .wp-hero-social {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #888;
        }

        .wp-hero-avatars {
          display: flex;
        }

        .wp-hero-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #fff;
          background: linear-gradient(135deg, #ff7b54, #e8404a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          margin-left: -8px;
        }

        .wp-hero-avatar:first-child { margin-left: 0; }

        /* Hero image panel */
        .wp-hero-visual {
          position: relative;
        }

        .wp-hero-img-frame {
          width: 100%;
          aspect-ratio: 4/5;
          border-radius: 24px;
          background: linear-gradient(145deg, #2a1a2e 0%, #1a0a0e 100%);
          overflow: hidden;
          position: relative;
          box-shadow: 0 24px 60px rgba(232,64,74,0.2);
        }

        .wp-hero-img-frame::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(232,64,74,0.15) 0%, transparent 60%);
        }

        /* Abstract art stand-in */
        .hero-art {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 6rem;
          opacity: 0.7;
        }

        .wp-hero-chip {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          background: #fff;
          border-radius: 12px;
          padding: 0.6rem 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          z-index: 2;
        }

        .wp-hero-chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #27ae60;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(39,174,96,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(39,174,96,0); }
        }

        .wp-hero-chip p { font-size: 0.75rem; font-weight: 600; color: #1a1a1a; }
        .wp-hero-chip span { font-size: 0.68rem; color: #888; }

        /* ── SECTIONS ── */
        .wp-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }

        .wp-section-label {
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: #e8404a;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }

        .wp-section-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 700;
          text-align: center;
          color: #1a1a1a;
          letter-spacing: -0.02em;
          margin-bottom: 0.6rem;
        }

        .wp-section-sub {
          text-align: center;
          color: #888;
          font-size: 0.95rem;
          margin-bottom: 3rem;
        }

        /* ── HOW IT WORKS ── */
        .hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .hiw-card {
          background: #fff;
          border-radius: 18px;
          padding: 2rem 1.5rem;
          box-shadow: 0 2px 16px rgba(200,80,60,0.06), 0 0 0 1px rgba(230,160,140,0.15);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .hiw-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(200,80,60,0.12); }

        .hiw-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 1.25rem;
        }

        .hiw-card h3 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.6rem;
          letter-spacing: -0.01em;
        }

        .hiw-card p { font-size: 0.88rem; color: #777; line-height: 1.6; }

        /* ── WHY WHISPR ── */
        .wp-why { background: #fff; }
        .wp-why-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }

        .comparison-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 20px rgba(200,80,60,0.08), 0 0 0 1px rgba(230,160,140,0.18);
        }

        .comparison-table th {
          padding: 1rem 1.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: #fff5f4;
          color: #555;
        }

        .comparison-table th:first-child { text-align: left; }
        .comparison-table th:nth-child(2) { background: #e8404a; color: #fff; }

        .comparison-table td {
          padding: 1rem 1.5rem;
          font-size: 0.9rem;
          border-top: 1px solid #f5ede8;
          text-align: center;
          color: #555;
        }

        .comparison-table td:first-child { text-align: left; font-weight: 500; color: #333; }

        .comparison-table tr:nth-child(even) td { background: #fffaf9; }
        .comparison-table tr:nth-child(even) td:nth-child(2) { background: #fff0ee; }
        .comparison-table td:nth-child(2) { background: #fff5f4; }

        .chip-red {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #fff0ee;
          border: 1px solid #fdc5bb;
          border-radius: 20px;
          padding: 0.2rem 0.6rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #e8404a;
        }

        /* ── TESTIMONIALS ── */
        .testi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .testi-card {
          background: #fff;
          border-radius: 18px;
          padding: 1.75rem;
          box-shadow: 0 2px 16px rgba(200,80,60,0.06), 0 0 0 1px rgba(230,160,140,0.15);
        }

        .testi-quote {
          font-size: 0.9rem;
          color: #555;
          line-height: 1.65;
          margin-bottom: 1.25rem;
          font-style: italic;
        }

        .testi-person { display: flex; align-items: center; gap: 0.6rem; }

        .testi-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff7b54, #e8404a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .testi-name { font-size: 0.88rem; font-weight: 600; color: #1a1a1a; }
        .testi-role { font-size: 0.75rem; color: #aaa; }

        /* ── CTA BANNER ── */
        .wp-cta-banner {
          background: linear-gradient(135deg, #e8404a 0%, #c0392b 100%);
          border-radius: 24px;
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin: 0 2rem 5rem;
          max-width: 1060px;
          margin-left: auto;
          margin-right: auto;
        }

        .wp-cta-banner::before {
          content: '';
          position: absolute;
          top: -40%;
          left: -10%;
          width: 50%;
          height: 200%;
          background: rgba(255,255,255,0.06);
          transform: rotate(-15deg);
          pointer-events: none;
        }

        .wp-cta-banner h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }

        .wp-cta-banner p { color: rgba(255,255,255,0.75); font-size: 0.95rem; margin-bottom: 2rem; }

        .btn-cta-white {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fff;
          color: #e8404a;
          border-radius: 50px;
          padding: 0.85rem 2rem;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.2); }

        /* ── FOOTER ── */
        .wp-footer {
          border-top: 1px solid #f0e8e5;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .wp-footer-logo {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 700;
          color: #e8404a;
          font-size: 1rem;
          text-decoration: none;
        }

        .wp-footer-links { display: flex; gap: 1.25rem; flex-wrap: wrap; }
        .wp-footer-links a { font-size: 0.8rem; color: #aaa; text-decoration: none; transition: color 0.15s; }
        .wp-footer-links a:hover { color: #e8404a; }

        .wp-footer-copy { font-size: 0.75rem; color: #ccc; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .wp-hero { grid-template-columns: 1fr; }
          .wp-hero-visual { display: none; }
          .hiw-grid { grid-template-columns: 1fr; }
          .testi-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .wp-nav { padding: 0 1rem; }
          .wp-section { padding: 3rem 1rem; }
          .wp-why-inner { padding: 3rem 1rem; }
        }
      `}</style>

      <div className="wp-root">
        {/* ── NAV ── */}
        <nav className="wp-nav">
          <a href="/" className="wp-nav-logo">Whispr</a>
          <Link href="/login" className="wp-nav-cta">Start Matching →</Link>
        </nav>

        {/* ── HERO ── */}
        <section className="wp-hero">
          <div>
            <div className="wp-hero-badge">
              <span>🔥</span> Talking to 512+
            </div>
            <h1>
              Meet people who like your <em>mind</em> before they see your face.
            </h1>
            <p className="wp-hero-desc">
              Whispr prioritises personality and connection. Blur the noise and focus on what actually matters.
            </p>
            <div className="wp-hero-actions">
              <Link href="/login" className="btn-primary-hero">
                Start Matching →
              </Link>
              <div className="wp-hero-social">
                <div className="wp-hero-avatars">
                  {['JO', 'LU', 'MA', 'AN'].map(i => (
                    <div key={i} className="wp-hero-avatar">{i}</div>
                  ))}
                </div>
                <span>Join 200,000+ users</span>
              </div>
            </div>
          </div>

          <div className="wp-hero-visual">
            <div className="wp-hero-img-frame">
              <div className="hero-art">🌀</div>
            </div>
            <div className="wp-hero-chip">
              <div className="wp-hero-chip-dot" />
              <div>
                <p>New Connections!</p>
                <span>2,400+ online right now</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="wp-section" style={{ paddingTop: '1rem' }}>
          <p className="wp-section-label">How It Works</p>
          <h2 className="wp-section-title">Three steps to a more meaningful connection</h2>
          <p className="wp-section-sub"> </p>
          <div className="hiw-grid">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="hiw-card">
                <div className="hiw-icon" style={{ background: step.color + '18' }}>
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY WHISPR ── */}
        <div className="wp-why">
          <div className="wp-why-inner">
            <p className="wp-section-label">Why Whispr?</p>
            <h2 className="wp-section-title">The difference between helping and connecting</h2>
            <p className="wp-section-sub" style={{ marginBottom: '2rem' }}> </p>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Whispr</th>
                  <th>Others</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>
                      <span className="chip-red">❤️ {row.whispr}</span>
                    </td>
                    <td>{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <section className="wp-section">
          <p className="wp-section-label">The Whisper Community</p>
          <h2 className="wp-section-title" style={{ marginBottom: '2.5rem' }}> </h2>
          <div className="testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testi-card">
                <p className="testi-quote">{t.quote}</p>
                <div className="testi-person">
                  <div className="testi-avatar">{t.initials}</div>
                  <div>
                    <p className="testi-name">{t.name}</p>
                    <p className="testi-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <div style={{ padding: '0 2rem 5rem' }}>
          <div className="wp-cta-banner">
            <h2>Ready to skip the surface?</h2>
            <p>Join 200,000+ others finding meaningful connections every day.</p>
            <Link href="/login" className="btn-cta-white">
              Start Matching Now
            </Link>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="wp-footer">
          <a href="/" className="wp-footer-logo">Whispr</a>
          <div className="wp-footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/safety">Safety</a>
            <a href="/support">Support</a>
            <a href="/careers">Careers</a>
          </div>
          <p className="wp-footer-copy">© 2024 Whispr. Crafted for Gen Z.</p>
        </footer>
      </div>
    </>
  );
}
