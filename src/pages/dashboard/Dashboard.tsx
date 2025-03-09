import { Grid } from '@mui/material';
import Sales from 'components/sections/dashboard/todays-sales/Sales';
import VisitorInsights from 'components/sections/dashboard/visitor-insights/VisitorInsights';
import TotalRevenue from 'components/sections/dashboard/total-revenue/TotalRevenue';
import CustomerSatisfaction from 'components/sections/dashboard/customer-satisfaction/CustomerSatisfaction';
// import TargetVsReality from 'components/sections/dashboard/target-vs-reality/TargetVsReality';
import TopProducts from 'components/sections/dashboard/top-products/TopProducts';
// import SalesMapping from 'components/sections/dashboard/sales-mapping/SalesMapping';
// import VolumeVsService from 'components/sections/dashboard/volume-vs-service/VolumeVsService';
// import ProductPerformance from 'components/sections/dashboard/product-performance/ProductPerformance';

const Dashboard = () => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} xl={7}>
        <Sales />
      </Grid>
      <Grid item xs={12} xl={6}>
        <VisitorInsights />
      </Grid>
      <Grid item xs={12} md={7} xl={5}>
        <CustomerSatisfaction />
      </Grid>
      <Grid item xs={12} md={5} xl={6}>
        <TotalRevenue />
      </Grid>
      <Grid item xs={12} xl={6}>
        <TopProducts />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
