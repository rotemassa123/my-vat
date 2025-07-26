import { 
  Button, 
  Container, 
  Typography, 
  Box
} from "@mui/material";
import styles from "./book-a-demo.module.scss";
import { bookADemoContent } from "./book-a-demo-data";

const BookADemo = ({ id }: { id?: string }) => {
  return (
    <section id={id} className={styles.bookADemoSection}>
      <Container maxWidth="xl" className={styles.container}>
        <Box className={styles.content}>
          {/* Left side - 3D illustration */}
          <Box className={styles.illustrationSection}>
            <Box className={styles.illustrationContainer}>
              <Box className={styles.illustration}>
                <img
                  src={bookADemoContent.illustration.src}
                  alt={bookADemoContent.illustration.alt}
                  className={styles.illustrationImage}
                />
              </Box>
            </Box>
          </Box>

          {/* Right side - Content */}
          <Box className={styles.contentSection}>
            <Box className={styles.textContent}>
              <Typography 
                variant="h1" 
                className={styles.mainTitle}
                sx={{
                  fontSize: '64px',
                  fontWeight: 700,
                  lineHeight: 1.248,
                  color: '#ffffff',
                  marginBottom: '23px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                {bookADemoContent.title}
              </Typography>
              
              <Typography 
                variant="h2" 
                className={styles.subtitle}
                sx={{
                  fontSize: '26px',
                  fontWeight: 400,
                  lineHeight: 1.248,
                  color: '#ffffff',
                  marginBottom: '120px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                {bookADemoContent.subtitle}
              </Typography>

              <Box className={styles.buttonGroup}>
                <Button
                  variant={bookADemoContent.buttons.scheduleDemo.variant}
                  className={styles.scheduleButton}
                  sx={{
                    border: '0.966px solid #ffffff',
                    borderRadius: '100px',
                    padding: '18px 36px',
                    fontSize: '26px',
                    fontWeight: 500,
                    textTransform: 'none',
                    color: '#ffffff',
                    fontFamily: 'Poppins, sans-serif',
                    backdropFilter: 'blur(7.5px)',
                    '&:hover': {
                      border: '0.966px solid #ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {bookADemoContent.buttons.scheduleDemo.text}
                </Button>
                
                <Button
                  variant={bookADemoContent.buttons.contactUs.variant}
                  className={styles.contactButton}
                  sx={{
                    backgroundColor: '#ffffff',
                    borderRadius: '100px',
                    padding: '18px 36px',
                    fontSize: '26px',
                    fontWeight: 500,
                    textTransform: 'none',
                    color: '#001441',
                    fontFamily: 'Poppins, sans-serif',
                    backdropFilter: 'blur(7.5px)',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  {bookADemoContent.buttons.contactUs.text}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </section>
  );
};

export default BookADemo; 