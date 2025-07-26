import { Box, Typography } from "@mui/material";
import styles from "./section-header.module.scss";

interface SectionHeaderProps {
  subTitle: string;
  title: string;
  description?: string;
}

const SectionHeader = ({
  subTitle,
  title,
  description,
}: SectionHeaderProps) => {
  return (
    <Box className={styles.headerContainer}>
      <Typography className={styles.subTitle}>{subTitle}</Typography>
      <Typography className={styles.title}>{title}</Typography>
      {description && (
        <Typography className={styles.description}>{description}</Typography>
      )}
    </Box>
  );
};

export default SectionHeader;
