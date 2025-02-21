import { useState, useEffect } from 'react';
import { SvgIconProps } from '@mui/material';
import OrderIcon from 'components/icons/OrderIcon';
import SalesIcon from 'components/icons/SalesIcon';

export interface SaleItem {
  label: string;
  value: string;
  growth: string;
  bgColor: string;
  iconBackgroundColor: string;
  icon?: string;
  svgIcon?: (props: SvgIconProps) => JSX.Element;
}

export const useSalesData = () => {
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    totalOrders: number;
    totalItems: number;
  }>({ totalSales: 0, totalOrders: 0, totalItems: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, ordersRes, itemRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/sales/today-total`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/orders/today-total`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/items/today-total`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
        ]);

        const sales = await salesRes.json();
        const orders = await ordersRes.json();
        const items = await itemRes.json();

        setSalesData({
          totalSales: sales.totalSales,
          totalOrders: orders.totalOrders,
          totalItems: items.totalItems,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setSalesData({ totalSales: 0, totalOrders: 0, totalItems: 0 });
      }
    };

    fetchData();
  }, []);

  const sales: SaleItem[] = [
    {
      label: 'Total Sales',
      value: `₹${salesData.totalSales.toLocaleString('en-IN')}`,
      growth: '+8%',
      bgColor: 'error.lighter',
      iconBackgroundColor: 'error.main',
      svgIcon: SalesIcon,
    },
    {
      label: 'Total Order',
      value: `${salesData.totalOrders.toLocaleString('en-IN')}`,
      growth: '+5%',
      bgColor: 'warning.lighter',
      iconBackgroundColor: 'error.dark',
      svgIcon: OrderIcon,
    },
    {
      label: 'Item Sold',
      value: `${salesData.totalItems.toLocaleString('en-IN')}`,
      growth: '+1.2%',
      bgColor: 'success.lighter',
      iconBackgroundColor: 'success.darker',
      icon: 'ion:pricetag',
    },
    {
      label: 'Customers',
      value: `${salesData.totalOrders.toLocaleString('en-IN')}`,
      growth: '+0.5%',
      bgColor: 'secondary.lighter',
      iconBackgroundColor: 'secondary.main',
      icon: 'material-symbols:person-add',
    },
  ];

  return sales;
};
