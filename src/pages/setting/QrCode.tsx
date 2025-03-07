import { Grid } from '@mui/material';
import QRPage from 'components/sections/dashboard/setting/QRCodePage';

const qrpage = () => {
  return (
    <Grid container spacing={2}>
      <QRPage />
    </Grid>
  );
};

export default qrpage;
