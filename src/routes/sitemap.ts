import { SvgIconProps } from '@mui/material';
import paths, { rootPaths } from './paths';
import DashboardIcon from 'components/icons/DashboardIcon';
import { MouseEventHandler } from 'react';

export interface MenuItem {
  id: number;
  name: string;
  pathName: string;
  path?: string;
  active?: boolean;
  icon?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  svgIcon?: (props: SvgIconProps) => JSX.Element;
  items?: MenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 1,
    name: 'Dashboard',
    path: rootPaths.root,
    pathName: 'dashboard',
    svgIcon: DashboardIcon,
    active: true,
  },
  {
    id: 9,
    name: 'Authentication',
    pathName: 'authentication',
    icon: 'material-symbols:security-rounded',
    active: true,
    items: [
      {
        id: 10,
        name: 'Sign in',
        path: paths.signin,
        pathName: 'sign-in',
        active: true,
      },
      {
        id: 11,
        name: 'Sign up',
        path: paths.signup,
        pathName: 'sign-up',
        active: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Menu',
    path: '/menu',
    pathName: 'menu',
    icon: 'ri:bar-chart-line',
    active: true,
    items: [
      {
        id: 3,
        name: 'AddMenuItems',
        path: '/addmenuitems',
        pathName: 'addmenuitems',
        active: true,
      },
      {
        id: 13,
        name: 'AddNewItems',
        path: '/addnewitems',
        pathName: 'addnewitems',
        active: true,
      },
    ],
  },
  {
    id: 12,
    name: 'Order',
    path: '/order',
    pathName: 'order',
    icon: 'ph:shopping-cart-light',
    active: true,
    items: [
      {
        id: 4,
        name: 'AddOrder',
        path: '/addorder',
        pathName: 'addorder',
        active: true,
      },
      {
        id: 15,
        name: 'EditOrder',
        path: '/editorder',
        pathName: 'editorder',
        disabled: true, // Mark as disabled
        active: false, // Optionally mark as inactive
        style: { cursor: 'not-allowed', color: 'gray' }, // Disable the cursor to indicate it's unclickable
      },
    ],
  },
  {
    id: 5,
    name: 'Sales Report',
    path: '/salesreport',
    pathName: 'salesreport',
    icon: 'ph:chart-line',
    active: true,
  },
  {
    id: 6,
    name: 'Reviews',
    path: '#!',
    pathName: 'reviews',
    icon: 'mdi:message-processing-outline',
    active: true,
  },
  {
    id: 7,
    name: 'Settings',
    path: '#!',
    pathName: 'settings',
    icon: 'fluent:settings-24-regular',
    active: true,
  },
  {
    id: 8,
    name: 'Sign Out',
    path: '#!',
    pathName: 'sign-out',
    icon: 'humbleicons:logout',
    active: true,
  },
];

export default sitemap;
