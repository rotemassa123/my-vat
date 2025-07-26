import { Box, Typography, Button, Container } from "@mui/material";
import styles from "./header.module.scss";

interface HeaderProps {
  menuItems?: string[];
}

const Header = ({ menuItems = ["Home", "About Us", "Sign up"] }: HeaderProps) => {
  return (
    <Box className={styles.headerContainer}>
      <Container maxWidth="xl" className={styles.headerContent}>
        <Box className={styles.logoSection}>
          <Typography variant="h6" className={styles.logoText}>
            <span className={styles.logoMy}>My</span>
            <span className={styles.logoVAT}>VAT</span>
          </Typography>
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
