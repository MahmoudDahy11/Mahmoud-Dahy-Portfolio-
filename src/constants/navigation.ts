import { FileText, FolderKanban, Home, Mail, MessageSquare, Palette, Share2, Sparkles, User, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ADMIN_ROUTES, PUBLIC_ROUTES } from './routes'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
}

/** Public navigation. Order here is the order shown in the header. */
export const PUBLIC_NAV: NavItem[] = [
  { label: 'Home', path: PUBLIC_ROUTES.home, icon: Home },
  { label: 'About', path: PUBLIC_ROUTES.about, icon: User },
  { label: 'Projects', path: PUBLIC_ROUTES.projects, icon: FolderKanban },
  { label: 'Experience', path: PUBLIC_ROUTES.experience, icon: Wrench },
  { label: 'Education', path: PUBLIC_ROUTES.education, icon: FileText },
  { label: 'Certificates', path: PUBLIC_ROUTES.certificates, icon: Sparkles },
  { label: 'Services', path: PUBLIC_ROUTES.services, icon: Palette },
  { label: 'Contact', path: PUBLIC_ROUTES.contact, icon: Mail },
]

/** Admin sidebar. Grouped so a long list stays scannable. */
export type NavGroup = {
  label: string
  items: NavItem[]
}

export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: ADMIN_ROUTES.dashboard, icon: Home }],
  },
  {
    label: 'Content',
    items: [
      { label: 'Profile', path: ADMIN_ROUTES.profile, icon: User },
      { label: 'About', path: ADMIN_ROUTES.about, icon: FileText },
      { label: 'Skills', path: ADMIN_ROUTES.skills, icon: Sparkles },
      { label: 'Projects', path: ADMIN_ROUTES.projects, icon: FolderKanban },
      { label: 'Experience', path: ADMIN_ROUTES.experience, icon: Wrench },
      { label: 'Education', path: ADMIN_ROUTES.education, icon: FileText },
      { label: 'Certificates', path: ADMIN_ROUTES.certificates, icon: Sparkles },
      { label: 'Services', path: ADMIN_ROUTES.services, icon: Palette },
      { label: 'Social Links', path: ADMIN_ROUTES.socialLinks, icon: Share2 },
    ],
  },
  {
    label: 'Inbox & Files',
    items: [
      { label: 'Messages', path: ADMIN_ROUTES.messages, icon: MessageSquare },
      { label: 'Media', path: ADMIN_ROUTES.media, icon: Palette },
    ],
  },
  {
    label: 'Configuration',
    items: [{ label: 'Settings', path: ADMIN_ROUTES.settings, icon: Wrench }],
  },
]
