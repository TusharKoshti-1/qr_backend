import { Grid } from '@mui/material';
import MenuPage from 'components/sections/dashboard/menu-item/MenuPage';

const menu = () => {
  return (
    <Grid container spacing={2}>
      <MenuPage />
    </Grid>
  );
};

export default menu;
