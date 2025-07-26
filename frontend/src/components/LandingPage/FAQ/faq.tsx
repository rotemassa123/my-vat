import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Container,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import styles from "./faq.module.scss";
import { faqContent } from "./faq-data";

const Faq = ({ id }: { id?: string }) => {
  const [expanded, setExpanded] = useState<number>(-1);

  const handleChange =
    (index: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? index : -1);
    };

  return (
    <Box id={id} className={styles.faqContainer}>
      <Container maxWidth="lg" className={styles.container}>
        <Box className={styles.header}>
          <Typography 
            variant="overline" 
            className={styles.subTitle}
            sx={{
              color: '#0090FF',
              fontWeight: 600,
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1.4px',
              marginBottom: 2
            }}
          >
            {faqContent.header.subTitle}
          </Typography>
          
          <Typography 
            variant="h3" 
            className={styles.title}
            sx={{
              fontSize: { xs: '28px', sm: '32px', md: '36px' },
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#001441',
              marginBottom: 2,
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {faqContent.header.title}
          </Typography>
          
          <Typography 
            className={styles.description}
            sx={{
              fontSize: '16px',
              lineHeight: 1.5,
              color: '#2f426d',
              fontFamily: 'Inter, sans-serif',
              maxWidth: '500px',
              margin: '0 auto'
            }}
          >
            {faqContent.header.description}
          </Typography>
          
        </Box>

        <Box className={styles.content}>
          <Box className={styles.faqGrid}>
            {faqContent.questions.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === index}
                onChange={handleChange(index)}
                className={`${styles.faqItem} ${
                  expanded === index ? styles.expanded : ""
                }`}
              >
                <AccordionSummary
                  className={styles.faqQuestion}
                  expandIcon={
                    expanded === index ? (
                      <RemoveIcon 
                        sx={{ 
                          color: '#0090FF',
                          fontSize: '18px'
                        }} 
                      />
                    ) : (
                      <AddIcon 
                        sx={{ 
                          color: '#0090FF',
                          fontSize: '18px'
                        }} 
                      />
                    )
                  }
                >
                  <Typography 
                    className={styles.questionText}
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#001441',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={styles.faqAnswer}>
                  <Typography 
                    className={styles.faqAnswerText}
                    sx={{
                      fontSize: '14px',
                      lineHeight: 1.4,
                      color: '#2f426d',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Faq;
