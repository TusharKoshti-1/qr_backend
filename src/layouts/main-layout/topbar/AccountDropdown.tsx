import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { MouseEvent, MouseEventHandler, useState } from 'react';
import Profile from 'assets/Profile.webp';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import IconifyIcon from 'components/base/IconifyIcon';
import paths from 'routes/paths';

interface MenuItem {
  id: number;
  label: string;
  icon: string;
  path?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  // items?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 0,
    label: 'Profile',
    icon: 'material-symbols:person',
  },
  {
    id: 1,
    label: 'My Account',
    icon: 'material-symbols:account-box-sharp',
  },
  {
    id: 2,
    label: 'Logout',
    icon: 'uiw:logout',
    path: paths.signin,
  },
];

const AccountDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate(); // Initialize the useNavigate hook


  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

   // Update the click handler for the logout item
   const handleMenuItemClick = (path?: string) => {
    if (path) {
      navigate(path); // Navigate to the given path
    }
    handleClose(); // Close the menu after clicking an item
  };


  const accountMenuItems = menuItems.map((menuItem) => (
    <MenuItem
      key={menuItem.id}
      onClick={() => handleMenuItemClick(menuItem.path)} // Trigger the navigate onClick for all items
      sx={{
        '&:hover .account-menu-icon': { color: 'common.white' },
      }}
    >
      <ListItemIcon>
        <IconifyIcon
          icon={menuItem.icon}
          sx={{ color: 'primary.main' }}
          className="account-menu-icon"
        />
      </ListItemIcon>
      <Typography variant="body1">{menuItem.label}</Typography>
    </MenuItem>
  ));

  return (
    <>
      <Button
        onClick={handleClick}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ px: { xs: 1, sm: 2 }, minWidth: 'auto' }}
      >
        <Avatar
          sx={{
            width: { xs: 48, sm: 60 },
            height: { xs: 48, sm: 60 },
            borderRadius: 4,
            mr: { xs: 0, xl: 2.5 },
          }}
          alt="User Profile"
          src={Profile}
        />
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Stack direction="row" alignItems="center" columnGap={6}>
            <Typography variant="h6" component="p" color="primary.darker" gutterBottom>
              Tushar
            </Typography>
            <IconifyIcon icon="ph:caret-down-bold" fontSize={16} color="primary.darker" />
          </Stack>
          <Typography variant="subtitle2" textAlign="left" color="primary.lighter">
            Admin
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {accountMenuItems}
      </Menu>
    </>
  );
};

export default AccountDropdown;
