'use client'

import { TwitterLogo, DiscordLogo, GithubLogo, ArrowUpRight } from '@phosphor-icons/react'

const footerLinks = {
  Protocol: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Leaderboard', href: '#leaderboard' },
    { label: 'Evaluation Rules', href: '#rules' },
    { label: 'Docs', href: 'https://docs.hyperscaled.trade', external: true },
  ],
  Community: [
    { label: 'Twitter / X', href: 'https://twitter.com/hyperscaled', external: true, icon: TwitterLogo },
    { label: 'Discord', href: 'https://discord.gg/hyperscaled', external: true, icon: DiscordLogo },
    { label: 'GitHub', href: 'https://github.com/hyperscaled', external: true, icon: GithubLogo },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Risk Disclosure', href: '/risk' },
    { label: 'Audit Report', href: '/audit', external: true },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-teal-400" />
              </div>
              <span className="text-sm font-bold tracking-tight">Hyperscaled</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[24ch]">
              Permissionless funded trading on Hyperliquid.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[TwitterLogo, DiscordLogo, GithubLogo].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.14] transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <div className="text-xs text-zinc-500 tracking-widest uppercase mb-4">{section}</div>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer' : undefined}
                        className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group"
                      >
                        {Icon && <Icon size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                        {link.label}
                        {link.external && (
                          <ArrowUpRight
                            size={10}
                            className="text-zinc-700 group-hover:text-zinc-500 transition-colors"
                          />
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 Hyperscaled. All rights reserved. Built on{' '}
            <a
              href="https://hyperliquid.xyz"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Hyperliquid
            </a>
            {' '}·{' '}
            Powered by{' '}
            <a
              href="https://bittensor.com"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Bittensor
            </a>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/audit"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
            >
              Audit Report <ArrowUpRight size={10} />
            </a>
            <a
              href="https://github.com/hyperscaled"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
            >
              Source Code <ArrowUpRight size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
