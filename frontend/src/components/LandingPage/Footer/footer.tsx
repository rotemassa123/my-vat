import { Box, Typography, Divider } from "@mui/material";
import { Link } from "react-scroll";
import styles from "./footer.module.scss";
import { footerContent } from "./footer-data";

interface FooterProps {
  navLinks: { label: string; id: string }[][];
}
const Footer = ({ navLinks }: FooterProps) => {
  return (
    <Box component="footer" className={styles.footer}>
      <Box className={styles.container}>
        <Box className={styles.logoContainer}>
          <Link to="hero-section" smooth={true} duration={500}>
            <img
              src={footerContent.logo.src}
              alt={footerContent.logo.alt}
              className={styles.logo}
            />
          </Link>
          <Typography className={styles.logoText}>
            {footerContent.logo.description}
          </Typography>
        </Box>

        <Box className={styles.navLinks}>
          {navLinks.map((group, index) => (
            <Box key={index} className={styles.section}>
              {group.map((item, i) => (
                <Typography key={i} className={styles.link}>
                  <Link to={item.id} smooth={true} duration={500}>
                    {item.label}
                  </Link>
                </Typography>
              ))}
            </Box>
          ))}
        </Box>

        <Box className={styles.contact}>
          {footerContent.contactLinks.map((item, index) => (
            <Box key={index} className={styles.contactItem}>
              <Typography className={styles.contactTitle}>
                {item.name}
              </Typography>
              <Typography className={styles.contactDetails}>
                {item.details}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider className={styles.divider} />

      <Box className={styles.socials}>
        {footerContent.socialIcons.map((icon, index) => (
          <img
            key={index}
            src={icon.src}
            alt={icon.alt}
            className={styles.icon}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Footer;
