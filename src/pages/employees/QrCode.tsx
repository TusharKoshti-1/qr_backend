import { Grid } from '@mui/material';
import QRPage from 'components/sections/dashboard/employee/QRCodePage';

const qrpage = () => {
  return (
    <Grid container spacing={2}>
      <QRPage />
    </Grid>
  );
};

export default qrpage;
