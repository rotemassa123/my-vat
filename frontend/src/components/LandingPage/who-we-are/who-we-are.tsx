import { Box, Typography, Container } from "@mui/material";
import SectionHeader from "../SectionHaeder/section-header";
import styles from "./who-we-are.module.scss";
import { whoWeAreContent } from "./who-we-are-data";

const WhoWeAre = ({ id }: { id?: string }) => {
  return (
    <Box id={id} className={styles.whoWeAreContainer}>
      <Container maxWidth="xl" className={styles.container}>
        <Box className={styles.content}>
          <Box className={styles.textSection}>
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
                {whoWeAreContent.header.subTitle}
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
                {whoWeAreContent.header.title}
              </Typography>
            </Box>
            
            <Typography 
              className={styles.description}
              sx={{
                fontSize: { xs: '16px', sm: '18px' },
                lineHeight: 1.7,
                color: '#2f426d',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {whoWeAreContent.description.map((item, index) =>
                item.type === "highlight" ? (
                  <span key={index} className={styles.primaryText}>
                    {item.text}
                  </span>
                ) : (
                  <span key={index}>{item.text}</span>
                )
              )}
            </Typography>
          </Box>
          
          <Box className={styles.imageSection}>
            <Box 
              className={styles.imagePlaceholder}
              sx={{
                width: '100%',
                height: '500px',
                background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#001441',
                  opacity: 0.7,
                  textAlign: 'center'
                }}
              >
                Team Illustration
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default WhoWeAre;
