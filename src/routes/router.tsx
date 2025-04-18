import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter, Navigate } from 'react-router-dom';
import paths, { employeePaths, rootPaths } from './paths';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const EmployeeLayout = lazy(() => import('layouts/employee-layout'));
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
const AddTableOrder = lazy(() => import('pages/table-order/AddTableOrder'));
const EditTableOrder = lazy(() => import('pages/table-order/EditTableOrder'));
const TableOrder = lazy(() => import('pages/table-order/TableOrder'));
const AddOrder = lazy(() => import('pages/order/AddOrder'));
const LandingPage = lazy(() => import('pages/customer/LandingPage'));
const CustomerPage = lazy(() => import('pages/customer/CustomerPage'));
const CartPage = lazy(() => import('pages/customer/CartPage'));
const SalesPage = lazy(() => import('pages/sales/SalesReport'));
const ItemPage = lazy(() => import('pages/sales/ItemReport'));
const SettingPage = lazy(() => import('pages/setting/Setting'));
const ThankyouPage = lazy(() => import('pages/thankyou/Thankyou'));
const ChargesPage = lazy(() => import('pages/setting/Charges'));
const ScanQRAgainPage = lazy(() => import('pages/thankyou/ScanQRCodeAgain'));
const QrPage = lazy(() => import('pages/setting/QrCode'));
const ContactUs = lazy(() => import('pages/contactus/ContactUs'));
const EmployeeSigninPage = lazy(() => import('pages/employees/EmployeeSignin'));
const EmployeePage = lazy(() => import('pages/employees/Employee'));
const AddEmployeePage = lazy(() => import('pages/employees/AddEmployee'));
const EmployeeOrderPage = lazy(() => import('pages/employees/EmloyeeOrder'));
const EmployeeAddOrderPage = lazy(() => import('pages/employees/EmployeeAddOrder'));
const EmployeeEditOrderPage = lazy(() => import('pages/employees/EmployeeEditOrder'));
const EmployeeMenuPage = lazy(() => import('pages/employees/menu'));
const EmployeeAddMenuItemsPage = lazy(() => import('pages/employees/addmenuitem'));
const EmployeeAddNewItemsPage = lazy(() => import('pages/employees/addnewitems'));

import PageLoader from 'components/loading/PageLoader';
import Progress from 'components/loading/Progress';
import PrivateRoute from './PrivateRoute';
import EmployeeRoute from './EmployeeRoute';

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
            path: paths.addorder,
            element: <AddOrder />,
          },
          {
            path: paths.addtableorder,
            element: <AddTableOrder />,
          },
          {
            path: paths.edittableorder,
            element: <EditTableOrder />,
          },
          {
            path: paths.tableorder,
            element: <TableOrder />,
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
          {
            path: paths.employee,
            element: <EmployeePage />,
          },
          {
            path: paths.addemployee,
            element: <AddEmployeePage />,
          },
          {
            path: paths.charges,
            element: <ChargesPage />,
          },
          {
            path: paths.contactus,
            element: <ContactUs />,
          },
        ],
      },
      {
        path: rootPaths.root,
        element: (
          <EmployeeRoute>
            <EmployeeLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </EmployeeLayout>
          </EmployeeRoute>
        ),
        children: [
          {
            path: employeePaths.order,
            element: <EmployeeOrderPage />,
          },
          {
            path: employeePaths.addorder,
            element: <EmployeeAddOrderPage />,
          },
          {
            path: employeePaths.editorder,
            element: <EmployeeEditOrderPage />,
          },
          {
            path: employeePaths.menu,
            element: <EmployeeMenuPage />,
          },
          {
            path: employeePaths.addmenuitems,
            element: <EmployeeAddMenuItemsPage />,
          },
          {
            path: employeePaths.addnewitems,
            element: <EmployeeAddNewItemsPage />,
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
      {
        path: paths.employeesignin,
        element: <EmployeeSigninPage />,
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
