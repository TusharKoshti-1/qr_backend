import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
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

import PageLoader from 'components/loading/PageLoader';
import Progress from 'components/loading/Progress';

export const routes = [
  {
    element: (
      <Suspense fallback={<Progress />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: rootPaths.root,
        element: (
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </MainLayout>
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
        ],
      },
      {
        path: rootPaths.authRoot,
        element: <AuthLayout />,
        children: [
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
      {
        path: '*',
        element: <Page404 />,
      },
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
    ],
  },
];

const router = createBrowserRouter(routes, { basename: '/RestaurantName' });

export default router;
