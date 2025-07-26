import { Box } from "@mui/material";
import HeroSection from "./HeroSection/hero-section";
import styles from "./landing-page.module.scss";
import MetricsSpacer from "./metrics-spacer/metrics-spacer";
import WhoWeAre from "./who-we-are/who-we-are";
import FeaturesSlide from "./FeaturesSlide/features-slide";
import ReviewSlide from "./ReviewSlide/review-slide";
import BookADemo from "./BookADemo/book-a-demo";
import Footer from "./Footer/footer";
import { footerNavLinks, SECTION_IDS } from "./navigationData";
import Faq from "./FAQ/faq";

const LandingPage = () => {
  return (
    <Box id={SECTION_IDS.HOME} className={styles.landingPgeBox}>
      {/* <Header menuItems={headerMenuItems} /> */}
      <HeroSection id={SECTION_IDS.HERO} />
      <MetricsSpacer />
      <WhoWeAre id={SECTION_IDS.WHO_WE_ARE} />
      <FeaturesSlide id={SECTION_IDS.FEATURES} />
      <ReviewSlide id={SECTION_IDS.TESTIMONIALS} />
      <BookADemo id={SECTION_IDS.BOOK_A_DEMO} />
      <Faq id={SECTION_IDS.FAQ} />
      <Footer navLinks={footerNavLinks} />
    </Box>
  );
};

export default LandingPage;
