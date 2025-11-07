import React from 'react';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  FormatListBulleted as InvoiceIcon,
  Settings,
  People as PeopleIcon,
  Domain as DomainIcon,
  Chat as ChatIcon,
  Link as LinkIcon,
  PlayArrow as PlayArrowIcon,
  PersonAdd as PersonAddIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { UserType } from './userType';

export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Static navigation lists for each user type
// Icons are stored as component references, className will be applied in AppLayout
export const OPERATOR_NAVIGATION: NavigationItem[] = [
  {
    path: '/magic-link',
    label: 'Magic Link',
    icon: LinkIcon,
  },
  {
    path: '/trigger-jobs',
    label: 'Trigger Jobs',
    icon: PlayArrowIcon,
  },
  {
    path: '/create-accounts',
    label: 'Create Accounts',
    icon: PersonAddIcon,
  },
  {
    path: '/support',
    label: 'Support',
    icon: SupportIcon,
  },
];

export const BASE_NAVIGATION: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
  },
  {
    path: '/analysis',
    label: 'Analysis',
    icon: AnalyticsIcon,
  },
  {
    path: '/reporting',
    label: 'Invoices',
    icon: InvoiceIcon,
  },
  {
    path: '/chat',
    label: 'AI Chat',
    icon: ChatIcon,
  },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    path: '/users',
    label: 'Users',
    icon: PeopleIcon,
  },
  {
    path: '/entities',
    label: 'Entities',
    icon: DomainIcon,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const MEMBER_VIEWER_NAVIGATION: NavigationItem[] = [
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

/**
 * Get navigation items based on user type
 */
export const getNavigationItems = (userType?: number): NavigationItem[] => {
  switch (userType) {
    case UserType.operator:
      return OPERATOR_NAVIGATION;
    
    case UserType.admin:
      return [...BASE_NAVIGATION, ...ADMIN_NAVIGATION];
    
    case UserType.member:
    case UserType.viewer:
      return [...BASE_NAVIGATION, ...MEMBER_VIEWER_NAVIGATION];
    
    default:
      return BASE_NAVIGATION;
  }
};

/**
 * User type indicator configuration
 */
export interface UserTypeIndicator {
  text: string;
  className: string;
}

export const getUserTypeIndicator = (userType?: number): UserTypeIndicator | null => {
  switch (userType) {
    case UserType.operator:
      return {
        text: 'Operator',
        className: 'userTypeOperator',
      };
    
    case UserType.admin:
      return {
        text: 'admin',
        className: 'userTypeAdmin',
      };
    
    case UserType.viewer:
      return {
        text: 'guest',
        className: 'userTypeGuest',
      };
    
    default:
      return null;
  }
};

