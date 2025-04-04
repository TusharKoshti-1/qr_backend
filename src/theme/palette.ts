import { PaletteColorOptions, PaletteOptions } from '@mui/material/styles';
import { grey, orange, red, green, purple, blue, yellow } from './colors';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: PaletteColor;
    green: PaletteColor;
    orange: PaletteColor;
    red: PaletteColor;
    yellow: PaletteColor;
  }

  interface PaletteOptions {
    neutral?: PaletteColorOptions;
    green?: PaletteColorOptions;
    orange?: PaletteColorOptions;
    red?: PaletteColorOptions;
    yellow?: PaletteColorOptions;
  }
  interface PaletteColor {
    lighter: string;
    darker: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }
}

const palette: PaletteOptions = {
  grey,
  text: {
    primary: orange[700], // Changed from indigo to a darker orange for text
    secondary: orange[300], // Lighter orange for secondary text
  },

  action: {
    hover: orange[300], // Orange for hover states
    selected: orange[500], // Orange for selected states
  },

  neutral: {
    lighter: grey[50],
    light: grey[300],
    main: grey[500],
    dark: grey[700],
    darker: grey[900],
    contrastText: '#fff',
  },

  primary: {
    lighter: orange[50], // Lightest orange shade
    light: orange[300], // Light orange
    main: orange[500], // Main orange (vibrant orange)
    dark: orange[700], // Darker orange
    darker: orange[900], // Darkest orange
  },

  secondary: {
    lighter: purple[50], // Keeping purple as secondary for contrast
    light: purple[300],
    main: purple[500],
    dark: purple[700],
    darker: purple[900],
  },

  error: {
    lighter: red[50],
    light: red[300],
    main: red[500],
    dark: red[700],
    darker: red[900],
  },

  warning: {
    lighter: orange[50], // Using orange shades for warning to maintain theme consistency
    light: orange[300],
    main: orange[500],
    dark: orange[700],
    darker: orange[900],
  },

  success: {
    lighter: green[50],
    light: green[300],
    main: green[500],
    dark: green[700],
    darker: green[900],
  },

  info: {
    lighter: blue[50],
    light: blue[300],
    main: blue[500],
  },

  green: {
    light: green[100],
    main: green[200],
    dark: green[400],
    darker: green[600],
  },

  orange: {
    main: orange[400], // Ensuring orange is fully defined
    lighter: orange[50],
    light: orange[300],
    dark: orange[700],
    darker: orange[900],
  },

  red: {
    main: red[800],
  },

  yellow: {
    main: yellow[500],
  },
};

export default palette;
