import { Box, Typography, Container, Paper } from "@mui/material";
import { metricsData } from "./metrics-data";
import styles from "./metrics-spacer.module.scss";

const MetricsSpacer = ({ id }: { id?: string }) => {
  return (
    <Box id={id} className={styles.metricsContainer}>
      <Container maxWidth="xl" className={styles.container}>
        <Paper elevation={0} className={styles.metricsCard}>
          <Box className={styles.metricsWrapper}>
            {metricsData.map((metric, index) => (
              <Box key={index} className={styles.metricBox}>
                <Typography 
                  className={styles.metricNumber}
                  sx={{
                    fontSize: { xs: '24px', sm: '28px', md: '32px', lg: '36px' },
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0090FF 0%, #0031FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'Poppins, sans-serif',
                    marginBottom: 1
                  }}
                >
                  {metric.number}
                </Typography>
                <Typography 
                  className={styles.metricLabel}
                  sx={{
                    fontSize: { xs: '14px', sm: '16px', md: '18px', lg: '20px' },
                    fontWeight: 500,
                    color: '#2f426d',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center'
                  }}
                >
                  {metric.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default MetricsSpacer;
