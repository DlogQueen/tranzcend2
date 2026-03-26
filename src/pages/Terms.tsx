export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-white p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-10">
          <img src="/logo.jpg" alt="Tranzcend X" className="h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-zinc-400 text-sm mt-2">Last updated: March 2026</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By accessing or using Tranzcend X ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.`
          },
          {
            title: '2. Eligibility',
            body: `You must be at least 18 years of age to use this Platform. By registering, you confirm that you are 18 or older and legally permitted to access adult content in your jurisdiction. We comply with 18 U.S.C. § 2257 record-keeping requirements. All performers on this platform are verified to be 18 years of age or older.`
          },
          {
            title: '3. Account Responsibilities',
            body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration. You may not share, sell, or transfer your account. You are responsible for all activity that occurs under your account.`
          },
          {
            title: '4. Content Standards',
            body: `All content must comply with applicable laws. You may not post, stream, or share content that: depicts minors in any sexual context; is non-consensual; involves real violence or harm; constitutes hate speech, transphobia, racism, or discrimination of any kind; harasses, threatens, or intimidates any person; violates any third party's intellectual property rights.`
          },
          {
            title: '5. Zero Tolerance Policy',
            body: `Tranzcend X has a strict zero tolerance policy for: transphobia, homophobia, racism, sexism, ableism, or any form of discrimination; harassment, stalking, or threatening behavior; non-consensual sharing of intimate images (revenge porn); impersonation of other users or public figures; any attempt to exploit, harm, or defraud other users.

Violations will result in immediate account termination and may be reported to law enforcement.`
          },
          {
            title: '6. Creator Terms',
            body: `Creators must complete identity verification before monetizing content. By posting content, you grant Tranzcend X a non-exclusive license to display your content on the Platform. You retain ownership of your content. You are responsible for paying applicable taxes on your earnings. Revenue splits are as agreed at time of creator approval.`
          },
          {
            title: '7. Payments & Refunds',
            body: `All purchases are final unless otherwise required by law. Deposits to your wallet are non-refundable except in cases of platform error. Chargebacks or fraudulent payment disputes will result in account suspension. We reserve the right to withhold earnings pending investigation of policy violations.`
          },
          {
            title: '8. Privacy',
            body: `Your use of the Platform is also governed by our Privacy Policy. We collect only the data necessary to operate the Platform. We do not sell your personal data to third parties. We use industry-standard encryption to protect your information.`
          },
          {
            title: '9. Termination',
            body: `We reserve the right to suspend or terminate any account at any time for violation of these terms. You may delete your account at any time from your wallet/settings page. Upon termination, your content may be removed and earnings may be forfeited if violations are found.`
          },
          {
            title: '10. Limitation of Liability',
            body: `Tranzcend X is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid us in the 30 days prior to the claim.`
          },
          {
            title: '11. Governing Law',
            body: `These terms are governed by the laws of the State of Nevada, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in Nevada.`
          },
          {
            title: '12. Contact',
            body: `For questions about these terms, contact us at: legal@tranzcendx.com`
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
