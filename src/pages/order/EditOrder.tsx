import { Grid } from '@mui/material';
import EditOrder from 'components/sections/dashboard/order/editorder';

const editorder = () => {
  return (
    <Grid container spacing={2}>
      <EditOrder />
    </Grid>
  );
};

export default editorder;
