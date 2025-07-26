import { Box, Typography, Container } from "@mui/material";
import { reviewsContent } from "./review-data";
import styles from "./review-slide.module.scss";

const ReviewSlide = ({ id }: { id?: string }) => {
  return (
    <Box id={id} className={styles.reviewContainer}>
      <Container maxWidth="xl" className={styles.container}>
        <Box className={styles.header}>
          <Typography 
            variant="overline" 
            className={styles.subTitle}
            sx={{
              color: '#0090FF',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1.4px',
              marginBottom: 2
            }}
          >
            {reviewsContent.header.subTitle}
          </Typography>
          
          <Typography 
            variant="h2" 
            className={styles.title}
            sx={{
              fontSize: { xs: '32px', sm: '40px', md: '48px', lg: '56px' },
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#001441',
              marginBottom: 6,
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {reviewsContent.header.title}
          </Typography>
        </Box>

        <Box className={styles.content}>
          <Box className={styles.stepsGrid}>
            {reviewsContent.steps.map((step, index) => (
              <Box key={index} className={styles.stepCard}>
                <Box 
                  className={styles.stepNumber}
                  sx={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #0090FF 0%, #0055FF 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 3,
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  {step.step}
                </Box>
                
                <Typography 
                  className={styles.stepIcon}
                  sx={{
                    fontSize: '48px',
                    marginBottom: 2,
                    textAlign: 'center'
                  }}
                >
                  {step.icon}
                </Typography>
                
                <Typography 
                  className={styles.stepTitle}
                  sx={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#001441',
                    marginBottom: 2,
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center'
                  }}
                >
                  {step.title}
                </Typography>
                
                <Typography 
                  className={styles.stepDescription}
                  sx={{
                    fontSize: '16px',
                    lineHeight: 1.6,
                    color: '#2f426d',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center'
                  }}
                >
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ReviewSlide;
