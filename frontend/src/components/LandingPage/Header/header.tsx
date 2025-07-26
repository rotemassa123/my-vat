import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CLOUDINARY_IMAGES } from "../../../consts/cloudinary";
import styles from "./header.module.scss";

interface HeaderProps {
  menuItems?: string[];
}

const Header = ({ menuItems = ["Home", "About Us"] }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Box className={styles.headerContainer}>
      <Container maxWidth="xl" className={styles.headerContent}>
        <Box className={styles.logoSection}>
          <img 
            src={CLOUDINARY_IMAGES.LOGO.MAIN}
            alt="MyVAT Logo"
            className={styles.logoImage}
            style={{ height: '40px', width: 'auto' }}
          />
        </Box>
        
        <Box className={styles.navigationSection}>
          <Box className={styles.navLinks}>
            {menuItems.map((item, index) => (
              <Typography 
                key={index} 
                variant="body1" 
                className={styles.navItem}
              >
                {item}
              </Typography>
            ))}
          </Box>
          
          <Button 
            variant="outlined" 
            className={styles.loginButton}
            onClick={handleLoginClick}
            sx={{
              borderColor: '#004dff',
              color: '#001441',
              borderRadius: '100px',
              padding: '18px 36px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#004dff',
                backgroundColor: 'rgba(0, 77, 255, 0.04)'
              }
            }}
          >
            Log in
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Header;
