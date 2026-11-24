import {
  Activity,
  Boxes,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  Library,
  Settings,
  ShieldAlert,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Milestone that delivers the page, when it is not part of Milestone 1. */
  milestone?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/frameworks', label: 'Frameworks', icon: Library, milestone: 'M3' },
  { to: '/graph', label: 'Compliance Graph', icon: Waypoints, milestone: 'M3' },
  { to: '/risks', label: 'Risks', icon: ShieldAlert, milestone: 'M4' },
  { to: '/evidence', label: 'Evidence', icon: FolderOpen },
  { to: '/deliverables', label: 'Deliverables', icon: FileCheck2, milestone: 'M4' },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];
