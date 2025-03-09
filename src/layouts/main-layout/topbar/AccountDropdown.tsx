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
import { MouseEvent, useState, useRef, useEffect } from 'react';
import Profile from 'assets/Profile.webp';
import { useNavigate } from 'react-router-dom';
import IconifyIcon from 'components/base/IconifyIcon';
import paths from 'routes/paths';
import axios from 'axios';

const AccountDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            }
          }
        );
        setProfileImage(response.data.profile_photo);
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };
    fetchProfilePhoto();
  }, []);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/upload-profile-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          }
        }
      );

      setProfileImage(response.data.profilePhoto);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload profile photo');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

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
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
            position: 'relative',
            ...(loading && {
              '&:after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)'
              }
            })
          }}
          alt="User Profile"
          src={profileImage || Profile}
        >
          {loading && (
            <IconifyIcon
              icon="eos-icons:loading"
              sx={{
                fontSize: 24,
                color: 'common.white',
                position: 'absolute'
              }}
            />
          )}
        </Avatar>
        
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Stack direction="row" alignItems="center" columnGap={6}>
            <Typography variant="h6" component="p" color="primary.darker" gutterBottom>
              Admin
            </Typography>
            <IconifyIcon icon="ph:caret-down-bold" fontSize={16} color="primary.darker" />
          </Stack>
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
        <MenuItem
          onClick={triggerFileInput}
          sx={{
            '&:hover .account-menu-icon': { color: 'common.white' },
          }}
        >
          <ListItemIcon>
            <IconifyIcon
              icon= 'material-symbols:person'
              sx={{ color: 'primary.main' }}
              className="account-menu-icon"
            />
          </ListItemIcon>
          <Typography variant="body1">Change Profile Photo</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => navigate(paths.signin)}
          sx={{
            '&:hover .account-menu-icon': { color: 'common.white' },
          }}
        >
          <ListItemIcon>
            <IconifyIcon
              icon="uiw:logout"
              sx={{ color: 'primary.main' }}
              className="account-menu-icon"
            />
          </ListItemIcon>
          <Typography variant="body1">Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountDropdown;