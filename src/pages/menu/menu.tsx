import { Box , Stack } from '@mui/material';
import {  useState } from 'react';
import Topbar from 'layouts/main-layout/topbar/Topbar';
import VerticalNavbar from 'layouts/main-layout/sidebar/VerticalNavbar';
import MenuPage from 'components/sections/dashboard/menu-item/MenuPage';


const drawerWidth = 345;

const menu = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <Stack direction="row">
      <Topbar drawerWidth={drawerWidth} onHandleDrawerToggle={handleDrawerToggle} />

      <VerticalNavbar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onHandleDrawerClose={handleDrawerClose}
      />
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          padding: 25,
          paddingLeft: 0,                                     
          minHeight: '100vh',
        }}
      >
        <MenuPage />
      </Box>

    </Stack>
  );
};

export default menu;
