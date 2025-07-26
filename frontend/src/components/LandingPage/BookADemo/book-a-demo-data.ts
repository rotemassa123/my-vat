import { CLOUDINARY_IMAGES } from "../../../consts/cloudinary";

export const bookADemoContent = {
  title: "Ready to reclaim more with less effort?",
  subtitle: "Book a demo or speak with a VAT expert today",
  buttons: {
    scheduleDemo: {
      text: "Schedule Demo",
      variant: "outlined" as const,
    },
    contactUs: {
      text: "Contact Us",
      variant: "contained" as const,
    },
  },
  illustration: {
    src: CLOUDINARY_IMAGES.BOOK_A_DEMO.ILLUSTRATION,
    alt: "3D VAT Recovery Illustration",
  },
  background: {
    src: CLOUDINARY_IMAGES.BOOK_A_DEMO.BACKGROUND,
    alt: "Book Demo Background",
  },
}; 