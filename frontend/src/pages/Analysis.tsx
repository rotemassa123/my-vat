import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Card,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import styles from './Analysis.module.scss';

const Analysis: React.FC = () => {
  const [analysisType, setAnalysisType] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const handleSubmit = () => {
    // Handle form submission
    console.log('Analysis Type:', analysisType);
    console.log('Additional Details:', additionalDetails);
  };

  const insightCards = [
    {
      id: 'comparative',
      title: 'Comparative Insights',
      description: 'Compare revenue efficiency and processing times across different countries and entities.',
      icon: <TrendingUpIcon className={styles.cardIcon} />,
      buttonText: 'View Insights',
    },
    {
      id: 'visualTrends',
      title: 'Visual Trends',
      description: 'Visualize which countries have the best (and worst) revenue efficiency for your clients.',
      icon: <BarChartIcon className={styles.cardIcon} />,
      buttonText: 'Explore Trends',
    },
    {
      id: 'downloadTrends',
      title: 'Visual Trends',
      description: 'Visualize which countries have the best (and worst) revenue efficiency for your clients.',
      icon: <DownloadIcon className={styles.cardIcon} />,
      buttonText: 'Download Report',
    },
  ];

  return (
    <Box className={styles.analysisContainer}>
      <Typography className={styles.pageTitle}>
        Analysis
      </Typography>

      {/* Insights Cards */}
      <Box className={styles.insightsGrid}>
        {insightCards.map((card) => (
          <Card
            key={card.id}
            className={`${styles.insightCard} ${styles[card.id]}`}
            elevation={0}
          >
            {card.icon}
            <Box>
              <Typography className={styles.cardTitle}>
                {card.title}
              </Typography>
              <Typography className={styles.cardDescription}>
                {card.description}
              </Typography>
            </Box>
            <Button
              className={`${styles.cardButton} ${styles[card.id]}`}
              variant="contained"
              disableElevation
            >
              {card.buttonText}
            </Button>
          </Card>
        ))}
      </Box>

      {/* Custom Analysis Section */}
      <Box className={styles.customAnalysisSection}>
        <Typography className={styles.sectionTitle}>
          Request Custom Analysis
        </Typography>
        <Typography className={styles.sectionDescription}>
          Need specific insights for your business? Our VAT specialists can prepare custom analysis reports tailored to your requirements.
        </Typography>

        <Box className={styles.formContainer}>
          <TextField
            className={styles.formField}
            label="Analysis Type"
            select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="country-comparison">Country Comparison</MenuItem>
            <MenuItem value="revenue-efficiency">Revenue Efficiency</MenuItem>
            <MenuItem value="processing-times">Processing Times</MenuItem>
            <MenuItem value="compliance-analysis">Compliance Analysis</MenuItem>
            <MenuItem value="custom">Custom Analysis</MenuItem>
          </TextField>

          <TextField
            className={styles.formField}
            label="Additional Details"
            multiline
            rows={4}
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Please describe what specific insights you're looking for..."
            fullWidth
            variant="outlined"
          />

          <Button
            className={styles.submitButton}
            variant="contained"
            disableElevation
            onClick={handleSubmit}
          >
            Request Analysis
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Analysis; 