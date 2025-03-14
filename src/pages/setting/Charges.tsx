import { Grid } from '@mui/material';
import Charges from 'components/sections/dashboard/setting/charges';

const charge = () => {
  return (
    <Grid container spacing={2}>
      <Charges />
    </Grid>
  );
};

export default charge;
