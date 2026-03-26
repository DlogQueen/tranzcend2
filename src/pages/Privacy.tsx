export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-white p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-10">
          <img src="/logo.jpg" alt="Tranzcend X" className="h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-zinc-400 text-sm mt-2">Last updated: March 2026</p>
        </div>

        {[
          {
            title: '1. What We Collect',
            body: `We collect only what is necessary to operate the Platform:\n• Email address and username at registration\n• Government ID for creator verification (stored securely, never shared)\n• Payment information (processed by third-party payment providers)\n• Usage data (pages visited, features used) for platform improvement\n• Device information for security purposes\n• Location data only if you enable nearby discovery (never stored permanently)`
          },
          {
            title: '2. How We Use Your Data',
            body: `We use your data to:\n• Operate and improve the Platform\n• Verify your identity and age\n• Process payments and payouts\n• Send important account notifications\n• Detect and prevent fraud and abuse\n• Comply with legal obligations\n\nWe do NOT use your data for advertising to third parties.`
          },
          {
            title: '3. Data Sharing',
            body: `We do not sell your personal data. We may share data with:\n• Payment processors (Stripe, Venmo) to process transactions\n• Identity verification services to confirm age and identity\n• Law enforcement when legally required\n• Service providers who help operate the Platform under strict confidentiality agreements\n\nWe will never share your data with advertisers or data brokers.`
          },
          {
            title: '4. LGBTQ+ Privacy Protections',
            body: `We understand the unique privacy needs of our community. We take extra precautions to protect sensitive information including gender identity, sexual orientation, and health information. We will never disclose this information to third parties, employers, family members, or government entities except where legally compelled. You have the right to use a pseudonym and hide your real identity on the Platform.`
          },
          {
            title: '5. Your Rights',
            body: `You have the right to:\n• Access the personal data we hold about you\n• Correct inaccurate data\n• Delete your account and associated data\n• Export your data\n• Opt out of non-essential communications\n\nTo exercise these rights, contact privacy@tranzcendx.com`
          },
          {
            title: '6. Data Security',
            body: `We use industry-standard security measures including:\n• End-to-end encryption for private messages\n• Encrypted storage for sensitive documents\n• Regular security audits\n• Two-factor authentication options\n• Secure HTTPS connections\n\nNo system is 100% secure. In the event of a breach, we will notify affected users within 72 hours.`
          },
          {
            title: '7. Cookies',
            body: `We use essential cookies to keep you logged in and remember your preferences. We do not use tracking cookies or third-party advertising cookies. You can disable cookies in your browser settings but some features may not work correctly.`
          },
          {
            title: '8. Data Retention',
            body: `We retain your data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days. Some data may be retained longer where required by law (e.g., financial records for 7 years per IRS requirements).`
          },
          {
            title: '9. Contact',
            body: `Privacy questions: privacy@tranzcendx.com\nData deletion requests: privacy@tranzcendx.com\nSecurity issues: security@tranzcendx.com`
          }
        ].map((section, i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
