import { useEffect, useMemo, useRef, useState } from 'react';
import { Divider, Paper, Stack, Typography } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { getTotal } from 'helpers/utils';
import Pin from 'components/icons/Pin';
import LegendToggleButton from 'components/common/LegendToggleButton';
import CustomerSatisfactionChart from './CustomerSatisfactionChart';
import axios from 'axios';

interface SatisfactionData {
  'last month': number[];
  'this month': number[];
}

const CustomerSatisfaction = () => {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData>({
    'last month': Array(7).fill(0),
    'this month': Array(7).fill(0),
  });
  const [loading, setLoading] = useState(true);
  const [legend, setLegend] = useState({
    'last month': false,
    'this month': false,
  });

  useEffect(() => {
    const fetchSatisfactionData = async () => {
      try {
        const response = await axios.get<SatisfactionData>(
          `${import.meta.env.VITE_API_URL}/api/customer-satisfaction`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setSatisfactionData(response.data);
      } catch (error) {
        console.error('Error fetching satisfaction data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSatisfactionData();
  }, []);

  const totalLastMonthSatisfaction = useMemo(
    () => getTotal(satisfactionData['last month']),
    [satisfactionData],
  );

  const totalThisMonthSatisfaction = useMemo(
    () => getTotal(satisfactionData['this month']),
    [satisfactionData],
  );

  const handleLegendToggle = (name: keyof typeof legend) => {
    setLegend((prev) => ({ ...prev, [name]: !prev[name] }));

    if (chartRef.current) {
      chartRef.current.getEchartsInstance().dispatchAction({
        type: 'legendToggleSelect',
        name: name,
      });
    }
  };

  if (loading) return <Paper sx={{ p: 3 }}>Loading satisfaction data...</Paper>;

  return (
    <Paper sx={{ py: 3, px: 1.5 }}>
      <Typography variant="h4" color="primary.dark" mb={3}>
        Customer Satisfaction
      </Typography>

      <CustomerSatisfactionChart
        chartRef={chartRef}
        data={satisfactionData}
        style={{ height: 182 }}
      />

      <Stack
        direction="row"
        justifyContent="center"
        divider={<Divider orientation="vertical" flexItem sx={{ height: 24 }} />}
        sx={{ borderTop: 1, borderColor: 'grey.A100', pt: 2 }}
        gap={2}
      >
        <LegendToggleButton
          name="Last Month"
          svgIcon={Pin}
          color="info.main"
          value={'₹' + totalLastMonthSatisfaction}
          legend={legend}
          onHandleLegendToggle={handleLegendToggle}
        />
        <LegendToggleButton
          name="This Month"
          svgIcon={Pin}
          color="success.dark"
          value={'₹' + totalThisMonthSatisfaction}
          legend={legend}
          onHandleLegendToggle={handleLegendToggle}
        />
      </Stack>
    </Paper>
  );
};

export default CustomerSatisfaction;
