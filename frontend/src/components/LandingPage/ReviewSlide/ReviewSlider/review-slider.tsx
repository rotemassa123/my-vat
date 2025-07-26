import { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import classNames from "classnames";
import type { Review } from "types/review-types";
import ReviewCard from "../ReviewCard/review-card";
import styles from "./review-slider.module.scss";

interface ReviewSliderProps {
  reviews: Review[];
}

const ReviewSlider = ({ reviews }: ReviewSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = reviews.length - 2;
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.setProperty(
        "--current-slide",
        currentSlide.toString()
      );
    }
  }, [currentSlide]);

  return (
    <Box className={styles.reviewsContainer}>
      <Box className={styles.reviewSlider} ref={sliderRef}>
        {reviews.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </Box>

      <Box className={styles.navigationDots}>
        {Array.from({ length: totalSlides }).map((_, dotIndex) => (
          <Box
            key={dotIndex}
            className={classNames(styles.navigationDot, {
              [styles.active]: dotIndex === currentSlide,
            })}
            onClick={() => setCurrentSlide(dotIndex)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ReviewSlider;
