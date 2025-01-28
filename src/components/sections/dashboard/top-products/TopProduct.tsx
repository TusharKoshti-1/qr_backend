import {
  Chip,
  LinearProgress,
  TableCell,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Product } from 'data/top-products';

const TopProduct = ({ product, maxSales }: { product: Product; maxSales: number }) => {
  const theme = useTheme();
  const { id, name, color, sales } = product;

  const [paletteOption, simplePaletteColorOption] = color.split('.') as [
    keyof typeof theme.palette,
    keyof (typeof theme.palette)[keyof typeof theme.palette],
  ];

  const productColor = theme.palette[paletteOption][simplePaletteColorOption];
  const percentage = maxSales > 0 ? (sales / maxSales) * 100 : 0;

  return (
    <TableRow>
      <TableCell>0{id}</TableCell>
      <TableCell>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
      </TableCell>
      <TableCell>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            bgcolor: alpha(productColor, 0.2),
            borderRadius: 2,
            width: 180,
            '& .MuiLinearProgress-bar': { bgcolor: color },
          }}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={sales} // Show actual sales count
          variant="outlined"
          sx={{
            color: color,
            borderColor: color,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

export default TopProduct;
