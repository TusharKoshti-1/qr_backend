import { SvgIconProps } from '@mui/material';
import paths, { rootPaths } from './paths';
import DashboardIcon from 'components/icons/DashboardIcon';
import { MouseEventHandler } from 'react';
import { CreditCardClock24Regular, Mail24Regular } from '@fluentui/react-icons'; // Import Fluent UI icon

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
        active: true,
      },
      {
        id: 25,
        name: 'OrderQRCode',
        path: '/qr-code',
        pathName: 'qr-code',
        active: true,
      },
    ],
  },
  {
    id: 12,
    name: 'Table Order',
    path: '/tableorder',
    pathName: 'order',
    icon: 'ph:table-light',
    active: true,
    items: [
      {
        id: 4,
        name: 'AddTableOrder',
        path: '/addtableorder',
        pathName: 'addorder',
        active: true,
      },
      {
        id: 35,
        name: 'EditTableOrder',
        path: '/edittableorder',
        pathName: 'edittableorder',
        active: true,
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
    items: [
      {
        id: 30,
        name: 'ItemReport',
        path: '/itemreport',
        pathName: 'itemreport',
        active: true,
      },
    ],
  },
  {
    id: 5,
    name: 'Employee',
    path: '/employee',
    pathName: 'employee',
    icon: 'ph:users', // Updated icon
    active: true,
    items: [
      {
        id: 30,
        name: 'Add Employee',
        path: '/addemployee',
        pathName: 'addemployee',
        active: true,
      },
    ],
  },
  {
    id: 7,
    name: 'Settings',
    path: '/settings',
    pathName: 'settings',
    icon: 'fluent:settings-24-regular',
    active: true,
  },
  {
    id: 20,
    name: 'View Charges',
    path: '/charges',
    pathName: 'charges',
    svgIcon: CreditCardClock24Regular, // Use Fluent UI component
    active: true,
  },
  {
    id: 25,
    name: 'Contact Us',
    path: '/contactus',
    pathName: 'contactus',
    svgIcon: Mail24Regular, // Use Fluent UI component
    active: true,
  },
  {
    id: 8,
    name: 'Sign Out',
    path: paths.signin,
    pathName: 'sign-out',
    icon: 'humbleicons:logout',
    active: true,
  },
];

export default sitemap;
