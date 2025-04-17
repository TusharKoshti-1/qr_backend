import { Grid } from '@mui/material';
import EmployeeOrderPage from 'components/sections/dashboard/employee/employeeorder';

const EmployeeOrder = () => {
  return (
    <Grid container spacing={2}>
      <EmployeeOrderPage />
    </Grid>
  );
};

export default EmployeeOrder;
