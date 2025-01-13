import { Grid } from '@mui/material';
import AddNewItem from 'components/sections/dashboard/menu-item/AddNewItems';

const menu = () => {
  return (
    <Grid container spacing={2}>
      <AddNewItem />
    </Grid>
  );
};

export default menu;
