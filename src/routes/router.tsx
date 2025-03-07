import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter, Navigate } from 'react-router-dom';
import paths, { rootPaths } from './paths';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard/Dashboard'));
const SignIn = lazy(() => import('pages/authentication/SignIn'));
const SignUp = lazy(() => import('pages/authentication/SignUp'));
const Page404 = lazy(() => import('pages/errors/Page404'));
const Menu = lazy(() => import('pages/menu/menu'));
const Addmenuitems = lazy(() => import('pages/menu/addmenuitem'));
const Addnewitems = lazy(() => import('pages/menu/addnewitems'));
const Order = lazy(() => import('pages/order/Order'));
const EditOrder = lazy(() => import('pages/order/EditOrder'));
const LandingPage = lazy(() => import('pages/customer/LandingPage'));
const CustomerPage = lazy(() => import('pages/customer/CustomerPage'));
const CartPage = lazy(() => import('pages/customer/CartPage'));
const SalesPage = lazy(() => import('pages/sales/SalesReport'));
const ItemPage = lazy(() => import('pages/sales/ItemReport'));
const SettingPage = lazy(() => import('pages/setting/Setting'));
const ThankyouPage = lazy(() => import('pages/thankyou/Thankyou'));
const ScanQRAgainPage = lazy(() => import('pages/customer/ScanQRCodeAgain'));
const QrPage = lazy(() => import('pages/setting/QrCode'));

import PageLoader from 'components/loading/PageLoader';
import Progress from 'components/loading/Progress';
import PrivateRoute from './PrivateRoute';

export const routes = [
  {
    element: (
      <Suspense fallback={<Progress />}>
        <App />
      </Suspense>
    ),
    children: [
      // Auth Routes: No TopBar/Sidebar
      {
        path: rootPaths.authRoot,
        element: (
          <AuthLayout>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </AuthLayout>
        ),
        children: [
          {
            index: true,
            element: <Navigate to={paths.signin} replace />, // Default to SignIn page
          },
          {
            path: paths.signin,
            element: <SignIn />,
          },
          {
            path: paths.signup,
            element: <SignUp />,
          },
        ],
      },
      // Protected Routes: Requires Authentication
      {
        path: rootPaths.root,
        element: (
          <PrivateRoute>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          </PrivateRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: paths.menu,
            element: <Menu />,
          },
          {
            path: paths.addmenuitems,
            element: <Addmenuitems />,
          },
          {
            path: paths.addnewitems,
            element: <Addnewitems />,
          },
          {
            path: paths.order,
            element: <Order />,
          },
          {
            path: paths.editorder,
            element: <EditOrder />,
          },
          {
            path: paths.salesreport,
            element: <SalesPage />,
          },
          {
            path: paths.itemreport,
            element: <ItemPage />,
          },
          {
            path: paths.settingpage,
            element: <SettingPage />,
          },
          {
            path: paths.qrcode,
            element: <QrPage />,
          },
        ],
      },
      // Customer Routes: Public
      {
        path: paths.landingpage,
        element: <LandingPage />,
      },
      {
        path: paths.customerpage,
        element: <CustomerPage />,
      },
      {
        path: paths.cartpage,
        element: <CartPage />,
      },
      {
        path: paths.thankyou,
        element: <ThankyouPage />,
      },
      {
        path: paths.scanqrcodeagain,
        element: <ScanQRAgainPage />,
      },
      // Catch-All Route
      {
        path: '*',
        element: <Page404 />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: '/' });

export default router;
