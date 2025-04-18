import { AppBar, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import sitemap, { MenuItem } from 'routes/Employeesitemap';
import { rootPaths } from 'routes/paths';
import Logo from 'components/icons/Logo';
import IconifyIcon from 'components/base/IconifyIcon';
import Search from 'components/common/Search';
import ElevationScroll from './ElevationScroll';
import AccountDropdown from './AccountDropdown';

interface TopbarProps {
  drawerWidth: number;
  onHandleDrawerToggle: () => void;
}

// Recursive function to find a matching nav item in the sitemap
const findNavItem = (sitemap: MenuItem[], path: string): MenuItem | undefined => {
  for (const item of sitemap) {
    if (item.path === path) return item; // If path matches, return the item
    if (item.items) {
      const found = findNavItem(item.items, path); // Check nested items
      if (found) return found;
    }
  }
  return undefined; // Return undefined if no match is found
};

const Topbar = ({ drawerWidth, onHandleDrawerToggle }: TopbarProps) => {
  const location = useLocation();

  // Use useMemo to find the current page title based on location
  const pageTitle = useMemo(() => {
    const navItem = findNavItem(sitemap, location.pathname); // Search for the matching nav item
    return navItem ? navItem.name : 'Default Page Title'; // Fallback to a default title
  }, [location]);

  return (
    <ElevationScroll>
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 5 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            columnGap={{ xs: 1, sm: 2 }}
            sx={{ display: { lg: 'none' } }}
          >
            <Link href={rootPaths.root}>
              <IconButton color="inherit" aria-label="logo">
                <Logo sx={{ fontSize: 56 }} />
              </IconButton>
            </Link>

            <IconButton color="inherit" aria-label="open drawer" onClick={onHandleDrawerToggle}>
              <IconifyIcon icon="mdi:hamburger-menu" sx={{ fontSize: { xs: 24, sm: 32 } }} />
            </IconButton>

            <IconButton aria-label="search-icon" sx={{ display: { md: 'none' } }}>
              <IconifyIcon
                icon="gravity-ui:magnifier"
                sx={{ color: 'primary.main', fontSize: { xs: 24, sm: 32 } }}
              />
            </IconButton>
          </Stack>

          <Typography
            variant="h1"
            color="primary.darker"
            sx={{ display: { xs: 'none', lg: 'block' } }}
          >
            {pageTitle}
          </Typography>

          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={{ xs: 1, sm: 2, xl: 5.25 }}
            width={1}
          >
            <Search
              sx={{
                display: { xs: 'none', md: 'block' },
                minWidth: 300,
                maxWidth: 550,
              }}
            />
            <AccountDropdown />
          </Stack>
        </Toolbar>
      </AppBar>
    </ElevationScroll>
  );
};

export default Topbar;
