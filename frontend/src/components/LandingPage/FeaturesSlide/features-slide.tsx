import { Box, Typography, Button, Container } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { featuresContent } from "./features-data";
import styles from "./features-slide.module.scss";

const FeaturesSlide = ({ id }: { id?: string }) => {
  return (
    <Box id={id} className={styles.featuresContainer}>
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
            {featuresContent.header.subTitle}
          </Typography>
          
          <Typography 
            variant="h2" 
            className={styles.title}
            sx={{
              fontSize: { xs: '32px', sm: '40px', md: '48px', lg: '56px' },
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#001441',
              marginBottom: 4,
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {featuresContent.header.title}
          </Typography>
        </Box>

        <Box className={styles.content}>
          <Box className={styles.featuresGrid}>
            {featuresContent.features.map((feature, index) => (
              <Box key={index} className={styles.featureCard}>
                <Box 
                  className={styles.iconContainer}
                  sx={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #0090FF 0%, #0055FF 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 3
                  }}
                >
                  <Box 
                    sx={{
                      width: '32px',
                      height: '32px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Icon placeholder */}
                    <Box 
                      sx={{
                        width: '16px',
                        height: '16px',
                        background: '#0090FF',
                        borderRadius: '2px'
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography 
                  className={styles.featureTitle}
                  sx={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#001441',
                    marginBottom: 2,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {feature.title}
                </Typography>
                
                <Typography 
                  className={styles.featureDescription}
                  sx={{
                    fontSize: '16px',
                    lineHeight: 1.6,
                    color: '#2f426d',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Box className={styles.buttonContainer}>
            <Button
              variant="outlined"
              className={styles.actionButton}
              endIcon={<ChevronRightIcon />}
              sx={{
                border: '2px solid #0090FF',
                color: '#0090FF',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                background: '#ffffff',
                boxShadow: '0 4px 16px rgba(0, 144, 255, 0.1)',
                '&:hover': {
                  background: '#0090FF',
                  color: '#ffffff',
                  border: '2px solid #0090FF',
                  boxShadow: '0 8px 24px rgba(0, 144, 255, 0.2)',
                }
              }}
            >
              Learn More
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturesSlide;
