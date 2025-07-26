import {
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { Link } from "react-scroll";
import type { HeaderProps } from "../header";
import styles from "./mobile-header.module.scss";
import { headerContent } from "../header-data";

const MobileHeader = ({ menuItems }: HeaderProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      <IconButton
        className={styles.menuButton}
        onClick={() => setDrawerOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box className={styles.drawerContent} role="presentation">
          <Box className={styles.closeButtonWrapper}>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List className={styles.drawerList}>
            {menuItems.map((item, index) => (
              <ListItem key={index} component="li">
                <Link
                  to={item.id}
                  smooth={true}
                  duration={500}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </Link>
              </ListItem>
            ))}
            <ListItem>
              <Button fullWidth variant="contained" color="primary">
                {headerContent.button.text}
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MobileHeader;
