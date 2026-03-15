import Link from 'next/link'

export const metadata = { title: 'Terms of Service | GritClub', description: 'GritClub Terms of Service' }

const C = { bg: '#0A0F1E', card: '#111827', border: 'rgba(255,255,255,0.06)', text: '#F0F4FF', muted: '#7B8DB0', dim: '#3D4F6E', blue: '#3B82F6', gold: '#F59E0B' }

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(37,99,235,0.15)', color: C.blue, fontFamily: 'DM Mono,monospace' }}>{n}</span>
      {title}
    </h2>
    <div style={{ color: C.muted, fontFamily: 'DM Sans,sans-serif', fontSize: 14, lineHeight: 1.8 }}>
      {children}
    </div>
  </section>
)

export default function TermsPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 800, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: C.text }}>
            Grit<span style={{ color: C.gold }}>Club</span>
          </span>
        </Link>
        <Link href="/privacy" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>
          Privacy Policy →
        </Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.blue, fontFamily: 'DM Sans,sans-serif', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 40, color: C.text, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: C.dim, fontFamily: 'DM Mono,sans-serif' }}>
            Last Updated: March 15, 2026 · Effective immediately
          </p>
          <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: C.blue, fontSize: 13, fontFamily: 'DM Sans,sans-serif' }}>
            By accessing GritClub or creating an account, you agree to these Terms. If you don't agree, please don't use the Service.
          </div>
        </div>

        <Section n={1} title="Acceptance of Terms">
          <p>By accessing GritClub ("the Service") at gritclub.live, downloading our mobile application, or creating an account, you confirm that you have read, understood, and agree to be bound by these Terms of Service. These Terms form a legally binding agreement between you and GritClub.</p>
        </Section>

        <Section n={2} title="Eligibility">
          <p>You must be at least <strong style={{ color: C.text }}>18 years old</strong> to use GritClub. By using the Service, you represent that you meet this requirement and are not barred from receiving services under applicable law. If you are using GritClub on behalf of a business entity, you represent that you have authority to bind that entity to these Terms.</p>
        </Section>

        <Section n={3} title="Accounts">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Create your account using accurate, current, and complete information</li>
            <li>Keep your login credentials secure — you are responsible for all activity under your account</li>
            <li>Notify us immediately at <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blue }}>gritclubhq@gmail.com</a> of any unauthorized use</li>
            <li>Accounts may be suspended or terminated for violations of these Terms</li>
            <li>You may not create multiple accounts to circumvent restrictions</li>
          </ul>
        </Section>

        <Section n={4} title="Host Responsibilities">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>All hosted content must comply with our Community Guidelines</li>
            <li>You retain ownership of your content but grant GritClub a worldwide, non-exclusive license to stream and distribute it</li>
            <li>No hate speech, illegal activities, spam, or misleading content is permitted</li>
            <li>Revenue split: <strong style={{ color: C.gold }}>Host earns 80%, GritClub retains 20%</strong> of all ticket sales</li>
            <li>Payouts processed weekly with a minimum threshold of $50 via Stripe</li>
            <li>Events that have sold tickets cannot be deleted — contact us for assistance</li>
            <li>Once an event starts (status: live), it cannot be edited. Once ended, it cannot be restarted.</li>
          </ul>
        </Section>

        <Section n={5} title="User Responsibilities (Audience)">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Do not harass, threaten, or abuse hosts or other attendees</li>
            <li>Paid tickets are non-refundable except at our sole discretion or as required by law</li>
            <li>Respect event capacity limits and access controls</li>
            <li>Do not record, screenshot, or redistribute event content without explicit host permission</li>
            <li>Do not attempt to circumvent paywalls or access events without valid tickets</li>
          </ul>
        </Section>

        <Section n={6} title="Payments & Pricing">
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>All payments are processed securely via Stripe. GritClub does not store your card details.</li>
            <li>Event ticket prices are set by hosts. Membership prices are set by GritClub.</li>
            <li>Membership plans auto-renew unless cancelled before the renewal date.</li>
            <li>No refunds are provided except as required by applicable law.</li>
            <li>You are responsible for all taxes applicable to your use of the Service.</li>
          </ul>
        </Section>

        <Section n={7} title="Content License">
          <p>You retain full ownership of any content you post, upload, or stream on GritClub. By submitting content, you grant GritClub a non-exclusive, worldwide, royalty-free license to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Stream and distribute your content to ticket holders and authorized viewers</li>
            <li>Use short clips for platform marketing with attribution</li>
            <li>Store and back up your content per our data retention policy</li>
          </ul>
          <p style={{ marginTop: 10 }}>This license ends when you delete the content or close your account, subject to our data retention obligations.</p>
        </Section>

        <Section n={8} title="Prohibited Activities">
          <p>You may not use GritClub to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe intellectual property rights of others</li>
            <li>Transmit malware, viruses, or harmful code</li>
            <li>Engage in unauthorized data collection or scraping</li>
            <li>Impersonate any person or entity</li>
            <li>Attempt to gain unauthorized access to the Service or other accounts</li>
          </ul>
        </Section>

        <Section n={9} title="Termination">
          <p>We reserve the right to suspend or terminate accounts at any time for violations of these Terms, with or without notice. You may delete your account at any time from your profile settings. Upon termination, your right to use the Service ends immediately. Content may be retained for legal compliance purposes per our Privacy Policy.</p>
        </Section>

        <Section n={10} title="Disclaimer of Warranties">
          <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. GRITCLUB DOES NOT GUARANTEE ANY SPECIFIC ATTENDANCE, REVENUE, OR RESULTS FROM USING THE SERVICE. YOUR USE IS AT YOUR SOLE RISK.</p>
        </Section>

        <Section n={11} title="Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRITCLUB'S TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE SHALL NOT EXCEED THE AMOUNT YOU PAID TO GRITCLUB IN THE 12 MONTHS PRECEDING THE CLAIM. GRITCLUB IS NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.</p>
        </Section>

        <Section n={12} title="Governing Law">
          <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai, Tamil Nadu, India. If you are outside India, you consent to this jurisdiction for dispute resolution.</p>
        </Section>

        <Section n={13} title="Changes to Terms">
          <p>We may update these Terms from time to time. We will notify you of material changes via email or prominent notice on the Service. Your continued use of GritClub after changes are posted constitutes acceptance of the updated Terms. You can always find the latest version at gritclub.live/terms.</p>
        </Section>

        {/* Contact */}
        <div style={{ padding: '24px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, marginTop: 40 }}>
          <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Syne,sans-serif', marginBottom: 8 }}>Questions?</p>
          <p style={{ fontSize: 14, color: C.muted, fontFamily: 'DM Sans,sans-serif' }}>
            Contact us at <a href="mailto:gritclubhq@gmail.com" style={{ color: C.blue }}>gritclubhq@gmail.com</a> — we typically respond within 24 hours.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 20, marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <Link href="/privacy" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Privacy Policy</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: C.blue, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Pricing</Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>Back to App</Link>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.dim, fontFamily: 'DM Mono,monospace' }}>© 2026 GritClub</span>
        </div>
      </div>
    </div>
  )
}
