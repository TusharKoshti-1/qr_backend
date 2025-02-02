import { useState, useEffect, useRef } from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import LegendToggleButton from 'components/common/LegendToggleButton';
import VisitorInsightsChart from './VisitorInsightsChart';

interface VisitorData {
  'loyal customers': number[];
  'new customers': number[];
  'unique customers': number[];
}

const VisitorInsights = () => {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [legend, setLegend] = useState({
    'loyal customers': false,
    'new customers': false,
    'unique customers': false,
  });

  useEffect(() => {
    const fetchVisitorData = async () => {
      try {
        const response = await fetch('https://exact-notable-tadpole.ngrok-free.app/api/visitors', {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });

        if (!response.ok) throw new Error('Failed to fetch visitor data');
        const data = await response.json();
        setVisitorData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, []);

  const handleLegendToggle = (name: keyof typeof legend) => {
    setLegend((prevState) => ({
      ...prevState,
      [name]: !prevState[name],
    }));

    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      instance.dispatchAction({
        type: 'legendToggleSelect',
        name: name,
      });
    }
  };

  if (loading) return <Paper sx={{ p: 3 }}>Loading visitor data...</Paper>;
  if (error)
    return (
      <Paper sx={{ p: 3 }} color="error">
        {error}
      </Paper>
    );
  if (!visitorData) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" color="primary.dark" mb={4}>
        Visitor Insights
      </Typography>

      <VisitorInsightsChart chartRef={chartRef} data={visitorData} style={{ height: 176 }} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="center"
        alignItems="flex-start"
        mt={4}
        px={{ xs: 0, sm: 1, lg: 0 }}
        rowGap={1}
        columnGap={{ sm: 1, md: 0.5, lg: 1, xl: 0.5 }}
      >
        <LegendToggleButton
          name="Loyal Customers"
          icon="ic:round-square"
          color="secondary.darker"
          legend={legend}
          onHandleLegendToggle={handleLegendToggle}
        />

        <LegendToggleButton
          name="New Customers"
          icon="ic:round-square"
          color="error.darker"
          legend={legend}
          onHandleLegendToggle={handleLegendToggle}
        />

        <LegendToggleButton
          name="Unique Customers"
          icon="ic:round-square"
          color="success.darker"
          legend={legend}
          onHandleLegendToggle={handleLegendToggle}
        />
      </Stack>
    </Paper>
  );
};

export default VisitorInsights;
