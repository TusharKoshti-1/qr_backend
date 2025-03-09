import { Grid } from '@mui/material';
import AddOrder from 'components/sections/dashboard/order/addorder';

const addorder = () => {
  return (
    <Grid container spacing={2}>
      <AddOrder />
    </Grid>
  );
};

export default addorder;
