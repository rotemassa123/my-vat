import { Card, CardContent, Avatar, Box, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import type { Review } from "types/review-types";
import styles from "./review-card.module.scss";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const { name, role, text, rating, avatar } = review;
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        sx={{
          color: index < rating ? '#FFD700' : '#E0E0E0',
          fontSize: '20px'
        }}
      />
    ));
  };

  return (
    <Card className={styles.reviewCard}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.starsContainer}>
          {renderStars(rating)}
        </Box>
        
        <Typography 
          className={styles.reviewText}
          sx={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#2f426d',
            marginBottom: 3,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          "{text}"
        </Typography>
        
        <Box className={styles.userInfo}>
          <Avatar 
            src={avatar.src} 
            alt={avatar.alt} 
            className={styles.avatar}
            sx={{
              width: '56px',
              height: '56px',
              marginRight: 2
            }}
          />
          <Box>
            <Typography 
              className={styles.userName}
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#001441',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {name}
            </Typography>
            <Typography 
              className={styles.userRole}
              sx={{
                fontSize: '14px',
                color: '#0090FF',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {role}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
