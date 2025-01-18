import { Grid } from '@mui/material';
import Order from 'components/sections/dashboard/order/order';

const order = () => {
  return (
    <Grid container spacing={2} sx={{ display: 'block' }}>
      <Order />
    </Grid>
  );
};

export default order;
