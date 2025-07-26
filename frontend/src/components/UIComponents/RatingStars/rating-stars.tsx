import React from 'react';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import { Box } from '@mui/material';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, maxRating = 5 }) => {
  const stars = [];
  
  for (let i = 1; i <= maxRating; i++) {
    if (rating >= i) {
      stars.push(<StarIcon key={i} color="primary" />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarHalfIcon key={i} color="primary" />);
    } else {
      stars.push(<StarBorderIcon key={i} color="primary" />);
    }
  }

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {stars}
    </Box>
  );
};

export default RatingStars; 