import { Shield, Heart, AlertTriangle, Users, Lock, Flag } from 'lucide-react';

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-background text-white p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-10">
          <img src="/logo.jpg" alt="Tranzcend X" className="h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold">Community Guidelines</h1>
          <p className="text-zinc-400 text-sm mt-2">Last updated: March 2026</p>
          <p className="text-zinc-300 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
            Tranzcend X was built by the LGBTQ+ community for everyone. These guidelines exist to keep this space safe, empowering, and free from the discrimination our community has faced everywhere else.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', title: 'Respect', desc: 'Every person deserves dignity regardless of identity' },
            { icon: Shield, color: 'text-teal-400', bg: 'bg-teal-500/10', title: 'Safety', desc: 'Your physical and emotional safety comes first' },
            { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Community', desc: 'We rise together or not at all' },
          ].map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className={`${v.bg} rounded-xl p-4 border border-white/5 text-center`}>
                <Icon className={`w-8 h-8 ${v.color} mx-auto mb-2`} />
                <h3 className="font-bold text-white">{v.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{v.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Rules */}
        {[
          {
            icon: Heart,
            color: 'text-pink-400',
            title: 'Respect All Identities',
            rules: [
              'Use correct pronouns and names — always',
              'Respect all gender identities, expressions, and sexual orientations',
              'No misgendering, deadnaming, or invalidating anyone\'s identity',
              'Inclusive language only — "adults" and "all genders" over exclusionary terms',
              'Celebrate diversity — trans, non-binary, intersex, queer, and all identities are welcome'
            ]
          },
          {
            icon: AlertTriangle,
            color: 'text-red-400',
            title: 'Zero Tolerance — Immediate Ban',
            rules: [
              'Transphobia, homophobia, biphobia, or any anti-LGBTQ+ sentiment',
              'Racism, sexism, ableism, or discrimination of any kind',
              'Hate speech, slurs, or dehumanizing language',
              'Harassment, stalking, threatening, or intimidating any user',
              'Non-consensual sharing of intimate images',
              'Any sexual content involving minors — reported to law enforcement immediately',
              'Outing someone\'s gender identity, sexuality, or HIV status without consent'
            ]
          },
          {
            icon: Lock,
            color: 'text-teal-400',
            title: 'Consent & Boundaries',
            rules: [
              'All interactions must be consensual',
              'Respect when someone says no or sets a boundary',
              'Do not pressure creators for content they are not comfortable with',
              'Private show requests must be accepted — never assumed',
              'Safe words and emergency stops must be respected immediately',
              'No means no — in chat, in shows, everywhere'
            ]
          },
          {
            icon: Users,
            color: 'text-purple-400',
            title: 'Community Standards',
            rules: [
              'Be kind — this is a community, not just a platform',
              'Support fellow creators — we are not in competition',
              'No spam, scamming, or misleading content',
              'No impersonating other users or public figures',
              'Keep financial disputes off public channels — use support',
              'Report violations — protecting the community is everyone\'s responsibility'
            ]
          },
          {
            icon: Flag,
            color: 'text-yellow-400',
            title: 'Content Rules',
            rules: [
              'All performers must be 18+ and verified',
              'Clearly label content with appropriate content warnings',
              'No content that glorifies real violence or harm',
              'Respect copyright — only post content you own or have rights to',
              'Explicit content is permitted in designated areas only',
              'No content designed to deceive or manipulate viewers'
            ]
          }
        ].map((section, i) => {
          const Icon = section.icon;
          return (
            <div key={i} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${section.color}`} />
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.rules.map((rule, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className={`${section.color} mt-0.5 flex-shrink-0`}>•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Reporting */}
        <div className="bg-gradient-to-br from-purple-900/30 to-teal-900/30 rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Flag className="w-5 h-5 text-purple-400" />
            How to Report
          </h2>
          <p className="text-zinc-300 text-sm mb-4">
            See something wrong? Use the report button on any profile, post, or stream. Our moderation team reviews all reports within 24 hours. Critical reports (hate speech, transphobia, harassment) are escalated immediately.
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="font-medium text-white mb-1">Emergency / Crisis</p>
              <p className="text-zinc-400">Use the panic button in any live stream to immediately end the stream and alert moderators.</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="font-medium text-white mb-1">Report a User</p>
              <p className="text-zinc-400">Tap ··· on any profile and select "Report User" with a reason.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 pb-4">
          Violations of these guidelines may result in content removal, temporary suspension, or permanent ban.<br />
          Questions? Contact <span className="text-teal-500">safety@tranzcendx.com</span>
        </p>
      </div>
    </div>
  );
}
