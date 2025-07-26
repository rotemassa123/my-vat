import { Box, Button, List, ListItem } from "@mui/material";
import type { HeaderProps } from "../header";
import { Link } from "react-scroll";
import styles from "./desktop-header.module.scss";
import { headerContent } from "../header-data";

const DesktopHeader = ({ menuItems }: HeaderProps) => {
  return (
    <Box className={styles.headerBox}>
      <Box className={styles.logo}>
        <Link to="hero-section" smooth duration={500}>
          <img
            src={headerContent.logo.src}
            alt={headerContent.logo.alt}
            className={styles.logoImage}
          />
        </Link>
      </Box>

      <nav className={styles.nav}>
        <List component="ul" className={styles.navList}>
          {menuItems.map((item, index) => (
            <ListItem key={index} component="li" className={styles.navItem}>
              <Link to={item.id} smooth duration={500}>
                {item.label}
              </Link>
            </ListItem>
          ))}
        </List>
      </nav>

      <Box className={styles.actions}>
        <Button className={styles.tryNowBtn} variant="contained">
          {headerContent.button.text}
        </Button>
      </Box>
    </Box>
  );
};

export default DesktopHeader;
