import { Grid } from '@mui/material';
import TableOrder from 'components/sections/dashboard/table-order/tableorder';

const tableorder = () => {
  return (
    <Grid container spacing={2}>
      <TableOrder />
    </Grid>
  );
};

export default tableorder;
