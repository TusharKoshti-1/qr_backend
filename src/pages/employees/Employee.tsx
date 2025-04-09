import { Grid } from '@mui/material';
import EmployeePage from 'components/sections/dashboard/employee/employee';

const Employee = () => {
  return (
    <Grid container spacing={2}>
      <EmployeePage />
    </Grid>
  );
};

export default Employee;
