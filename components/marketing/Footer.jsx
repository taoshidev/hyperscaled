'use client'

import Link from 'next/link'
import { TwitterLogo, DiscordLogo, GithubLogo, ArrowUpRight } from '@phosphor-icons/react'

const footerLinks = {
  Protocol: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Rules', href: '/rules' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'For Agents', href: '/agents' },
  ],
  Community: [
    { label: 'Twitter / X', href: 'https://x.com/hyperscaledhq', external: true, icon: TwitterLogo },
    { label: 'Discord', href: 'https://discord.gg/hyperscaledhq', external: true, icon: DiscordLogo },
    { label: 'GitHub', href: 'https://github.com/taoshidev', external: true, icon: GithubLogo },
    { label: 'Contact Support', href: 'mailto:support@hyperscaled.trade', external: true },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

/* Social icons in brand column */
const socialIcons = [
  { Icon: TwitterLogo, href: 'https://x.com/hyperscaledhq', label: 'Twitter' },
  { Icon: DiscordLogo, href: 'https://discord.gg/hyperscaledhq', label: 'Discord' },
  { Icon: GithubLogo, href: 'https://github.com/taoshidev', label: 'GitHub' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="block mb-4">
              <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-7 w-auto" />
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[24ch] [text-wrap:pretty]">
              Permissionless funded trading on&nbsp;Hyperliquid.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {socialIcons.map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-8 h-8 rounded-lg bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] flex items-center justify-center text-zinc-400 hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14)] transition-[color,box-shadow] duration-150 active:scale-[0.96] after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-1/2"
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
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const IconComp = link.icon
                  const isExternal = link.external

                  /* External links use plain <a>, internal use Next.js <Link> */
                  const Wrapper = isExternal ? 'a' : Link
                  const isMail = link.href.startsWith('mailto:')
                  const extraProps = isExternal && !isMail
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {}

                  return (
                    <li key={link.label}>
                      <Wrapper
                        href={link.href}
                        {...extraProps}
                        className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 group py-1.5"
                      >
                        {IconComp && <IconComp size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                        {link.label}
                        {isExternal && !isMail && (
                          <ArrowUpRight
                            size={10}
                            className="text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-px group-hover:-translate-y-px transition-[color,transform] duration-150"
                          />
                        )}
                      </Wrapper>
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
            © 2026 Hyperscaled. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Built on{' '}
            <a
              href="https://hyperliquid.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Hyperliquid
            </a>
            {' '}·{' '}
            Powered by{' '}
            <a
              href="https://bittensor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Bittensor
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
