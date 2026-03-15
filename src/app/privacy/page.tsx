import Link from 'next/link'

export const metadata = { title: 'Privacy Policy | GritClub', description: 'GritClub Privacy Policy' }

const C = { bg: '#0A0F1E', card: '#111827', border: 'rgba(255,255,255,0.06)', text: '#F0F4FF', muted: '#7B8DB0', dim: '#3D4F6E', blue: '#3B82F6', gold: '#F59E0B', green: '#10B981' }

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: C.green, fontFamily: 'DM Mono,monospace' }}>{n}</span>
      {title}
    </h2>
    <div style={{ color: C.muted, fontFamily: 'DM Sans,sans-serif', fontSize: 14, lineHeight: 1.8 }}>
      {children}
    </div>
  </section>
)

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');`}</style>

      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 800, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: C.text }}>
            Grit<span style={{ color: C.gold }}>Club</span>
          </span>
        </Link>
        <Link href="/terms" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>
          Terms of Service →
        </Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, fontFamily: 'DM Sans,sans-serif', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 40, color: C.text, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: C.dim, fontFamily: 'DM Mono,sans-serif' }}>
            Last Updated: March 15, 2026 · Effective immediately
          </p>
          <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: C.green, fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>
            <strong>We never sell your data.</strong> GritClub is built on trust. This policy explains exactly what we collect, why we collect it, and your rights under India's Digital Personal Data Protection Act (DPDP Act 2023).
          </div>
        </div>

        <Section n={1} title="What We Collect">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Account Data', items: ['Email address, full name, profile photo, username', 'Role (host/audience), account creation date', 'Social links (Instagram, X, LinkedIn, website) if provided'] },
              { label: 'Payment Data', items: ['Stripe payment tokens (we never store raw card numbers)', 'Transaction amounts, ticket purchase history', 'Payout information for hosts'] },
              { label: 'Content Data', items: ['Posts, comments, messages you create', 'Event streams (recorded only for premium users)', 'Group files, shared notes'] },
              { label: 'Usage Data', items: ['Events attended, pages visited, features used', 'Session duration, click patterns (anonymized)', 'Search queries within the platform'] },
              { label: 'Device Data', items: ['IP address, browser type, operating system', 'Device identifiers for security purposes', 'Geolocation (city level only, for timezone features)'] },
            ].map(cat => (
              <div key={cat.label} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                <p style={{ fontWeight: 600, color: C.text, marginBottom: 8, fontSize: 13 }}>{cat.label}</p>
                <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cat.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section n={2} title="How We Use Your Data">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: C.text }}>Service delivery:</strong> Providing event access, processing payments, managing payouts</li>
            <li><strong style={{ color: C.text }}>Platform improvement:</strong> Analyzing usage patterns to improve features (anonymized)</li>
            <li><strong style={{ color: C.text }}>Communication:</strong> Event reminders, payout notifications, important updates</li>
            <li><strong style={{ color: C.text }}>Security:</strong> Fraud detection, abuse prevention, account protection</li>
            <li><strong style={{ color: C.text }}>Legal compliance:</strong> Meeting obligations under Indian law including DPDP Act 2023</li>
            <li><strong style={{ color: C.text }}>Marketing:</strong> Only with your explicit consent — you can opt out anytime</li>
          </ul>
        </Section>

        <Section n={3} title="Who We Share Data With">
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.text }}>We never sell your personal data to third parties. Ever.</strong></p>
          <p>We share data only with:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: C.text }}>Stripe:</strong> Payment processing. Subject to Stripe's privacy policy.</li>
            <li><strong style={{ color: C.text }}>Supabase:</strong> Database and authentication hosting (data stored in EU/US regions with standard contractual clauses)</li>
            <li><strong style={{ color: C.text }}>Vercel:</strong> Application hosting and CDN</li>
            <li><strong style={{ color: C.text }}>Legal authorities:</strong> Only when required by valid court order or applicable law</li>
            <li><strong style={{ color: C.text }}>Business transfer:</strong> In case of merger or acquisition, with advance notice to you</li>
          </ul>
        </Section>

        <Section n={4} title="Cookies & Tracking">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: C.text }}>Essential cookies:</strong> Required for authentication, sessions, and security. Cannot be disabled.</li>
            <li><strong style={{ color: C.text }}>Analytics cookies:</strong> Usage pattern analysis. Opt-out available in settings.</li>
            <li><strong style={{ color: C.text }}>Marketing cookies:</strong> Event retargeting. Opt-out available at any time.</li>
          </ul>
          <p style={{ marginTop: 12 }}>We use a cookie consent banner on first visit where applicable under DPDP Act 2023.</p>
        </Section>

        <Section n={5} title="Security">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>HTTPS encryption across all connections</li>
            <li>Supabase Row Level Security — users can only access their own data</li>
            <li>Stripe PCI-DSS compliance for all payment processing</li>
            <li>bcrypt password hashing with salt for any custom authentication</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>SQL injection prevention via parameterized queries</li>
          </ul>
        </Section>

        <Section n={6} title="Data Retention">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: C.text }}>Accounts:</strong> Retained until you request deletion</li>
            <li><strong style={{ color: C.text }}>Event recordings:</strong> 30 days for free, unlimited for premium users</li>
            <li><strong style={{ color: C.text }}>Chat messages:</strong> Event duration + 7 days</li>
            <li><strong style={{ color: C.text }}>Payment records:</strong> 7 years (mandatory under Indian tax law)</li>
            <li><strong style={{ color: C.text }}>Posts & content:</strong> Until you delete them or close your account</li>
            <li><strong style={{ color: C.text }}>Audit logs:</strong> 12 months for security purposes</li>
          </ul>
        </Section>

        <Section n={7} title="Your Rights (India DPDP Act 2023)">
          <p>Under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong style={{ color: C.text }}>Access:</strong> Request a copy of your personal data we hold</li>
            <li><strong style={{ color: C.text }}>Correction:</strong> Update inaccurate or incomplete data</li>
            <li><strong style={{ color: C.text }}>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements)</li>
            <li><strong style={{ color: C.text }}>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong style={{ color: C.text }}>Grievance:</strong> Lodge a complaint with India's Data Protection Board</li>
          </ul>
          <p style={{ marginTop: 12 }}>To exercise any right, email <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blue }}>gritclubhq@gmail.com</a> with "Privacy Request" in the subject. We will respond within 30 days.</p>
        </Section>

        <Section n={8} title="Children's Privacy">
          <p>GritClub is not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from someone under 18, we will delete it immediately. If you believe we may have collected data from a minor, contact us at <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blue }}>gritclubhq@gmail.com</a>.</p>
        </Section>

        <Section n={9} title="International Data Transfers">
          <p>Your data may be processed in India, the European Union, or the United States via our service providers (Supabase, Stripe, Vercel). These transfers are conducted under appropriate legal mechanisms including standard contractual clauses as permitted by the DPDP Act 2023.</p>
        </Section>

        <Section n={10} title="Changes to This Policy">
          <p>We will notify you of material changes to this Privacy Policy via email and prominent notice on the Service at least 14 days before they take effect. Minor changes may be made without notice but will be reflected in the "Last Updated" date. Continued use of GritClub after changes constitutes acceptance.</p>
        </Section>

        <div style={{ padding: '24px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, marginTop: 40 }}>
          <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 8 }}>Privacy Contact</p>
          <p style={{ fontSize: 14, color: C.muted, fontFamily: 'DM Sans,sans-serif', lineHeight: 1.7 }}>
            For privacy requests, data deletion, or questions:<br />
            📧 <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blue }}>gritclubhq@gmail.com</a><br />
            Subject: "Privacy Request" — Response within 30 days as required by DPDP Act 2023.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <Link href="/terms" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Terms of Service</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Pricing</Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Back to App</Link>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.dim, fontFamily: 'DM Mono,monospace' }}>© 2026 GritClub</span>
        </div>
      </div>
    </div>
  )
}
