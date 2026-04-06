import { buildMetadata } from '@/lib/metadata'
import { redirect } from 'next/navigation'

export const metadata = buildMetadata({
  title: 'Getting Started — Hyperscaled Funded Trading',
  description:
    'Complete guide to getting started with Hyperscaled. Registration walkthrough, payment methods, challenge rules, and what happens after you pass.',
  path: '/getting-started',
})

export default function GettingStarted() {
  redirect('/')
}
