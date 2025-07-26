import { 
  Button, 
  Container, 
  Typography, 
  Box,
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import Header from "../Header/header";
import styles from "./hero-section.module.scss";
import { CLOUDINARY_IMAGES } from "../../../consts/cloudinary";

const HeroSection = ({ id }: { id?: string }) => {
  return (
    <section id={id} className={styles.heroSection}>
      <Header menuItems={["Home", "About Us", "Sign up"]} />
      
      <Container maxWidth="xl" className={styles.container}>
        {/* Hero Content */}
        <Box className={styles.heroContent}>
          <Box className={styles.textSection}>
            <Typography 
              variant="h1" 
              className={styles.title}
              sx={{
                fontSize: '68px',
                fontWeight: 700,
                lineHeight: 1.336,
                color: '#001441',
                marginBottom: 3,
                '& .gradient-text': {
                  background: 'linear-gradient(135deg, #0090FF 0%, #0031FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                },
                '& .italic-text': {
                  fontStyle: 'italic',
                  fontWeight: 300
                }
              }}
            >
              Maximize Your<br />
              <span className="gradient-text">Global VAT Refunds</span><br />
              <span className="italic-text">Without the Hassle</span>
            </Typography>
            
            <Typography 
              variant="h2" 
              className={styles.subtitle}
              sx={{
                fontSize: '26px',
                fontWeight: 400,
                lineHeight: 1.42,
                color: '#2f426d',
                marginBottom: 6,
                '& .bold-text': {
                  fontWeight: 600
                }
              }}
            >
              Automated, secure, and fully compliant{' '}
              <span className="bold-text">VAT reclaim</span>
              {' '}for companies doing business across borders.
            </Typography>

            <Button
              variant="contained"
              className={styles.ctaButton}
              endIcon={
                <Box className={styles.arrowIcon}>
                  <ArrowForward />
                </Box>
              }
              sx={{
                background: 'linear-gradient(135deg, #0090FF 0%, #0031FF 100%)',
                borderRadius: '100px',
                padding: '10px 40px',
                fontSize: '18px',
                fontWeight: 500,
                textTransform: 'none',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 144, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0078E6 0%, #0028E6 100%)',
                  boxShadow: '0 6px 25px rgba(0, 144, 255, 0.4)'
                }
              }}
            >
              Get Started with MyVAT
            </Button>
          </Box>

          <Box className={styles.imageSection}>
            <Box className={styles.heroImage}>
              {/* Transparent placeholder for the 3D illustration */}
              <Box 
                className={styles.illustration}
                sx={{
                  width: '100%',
                  height: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <img
                  src={CLOUDINARY_IMAGES.HERO.ILLUSTRATION}
                  alt="3D Tax Illustration"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 20 }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </section>
  );
};

export default HeroSection;
