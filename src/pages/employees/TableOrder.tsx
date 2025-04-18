import { Grid } from '@mui/material';
import TableOrder from 'components/sections/dashboard/employee/tableorder';

const tableorder = () => {
  return (
    <Grid container spacing={2} sx={{ display: 'block' }}>
      <TableOrder />
    </Grid>
  );
};

export default tableorder;
