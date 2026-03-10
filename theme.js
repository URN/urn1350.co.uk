
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#5F2A87',
    },
    secondary: {
      main: '#7A4B91',
    },
    error: {
      main: '#B14427',
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;