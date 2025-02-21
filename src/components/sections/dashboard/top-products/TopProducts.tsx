import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TopProduct from './TopProduct';
import { Product } from 'data/top-products';

const TopProducts = () => {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [maxSales, setMaxSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/top`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch top products');
        const data: Product[] = await response.json();
        setTopProducts(data);
        // Calculate max sales for progress bar percentages
        const max = data.length > 0 ? Math.max(...data.map((p) => p.sales)) : 0;
        setMaxSales(max);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  if (loading) return <Typography p={3}>Loading...</Typography>;
  if (error)
    return (
      <Typography p={3} color="error">
        {error}
      </Typography>
    );

  return (
    <Paper sx={{ pt: 3 }}>
      <Typography variant="h4" color="primary.dark" px={3} mb={1.25}>
        Top Products
      </Typography>
      <Box sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Popularity</TableCell>
              <TableCell>Sales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topProducts.map((product, index) => (
              <TopProduct
                key={product.id}
                product={product}
                maxSales={maxSales}
                rank={index + 1} // Add rank prop here
              />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
};

export default TopProducts;
