import { CLOUDINARY_IMAGES } from "../../../consts/cloudinary";

export const faqContent = {
  header: {
    subTitle: "FAQ",
    title: "Common Questions",
    description: "Quick answers to your VAT recovery questions.",
  },
  questions: [
    {
      question: "How does VAT recovery work?",
      answer: "We analyze your invoices, identify eligible refunds, and handle submissions to tax authorities. You track progress in real-time and receive your refund directly.",
    },
    {
      question: "Which countries do you support?",
      answer: "We support 50+ countries including all EU member states, UK, Switzerland, and Norway. Each country's regulations are handled automatically.",
    },
    {
      question: "How long does it take?",
      answer: "Most refunds are processed within 30-60 days. Our real-time tracking keeps you updated throughout the entire process.",
    },
    {
      question: "What documents do I need?",
      answer: "Upload your invoices and supporting documentation. We accept PDF, images, and integrate with most accounting systems.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use bank-level encryption and are fully GDPR compliant. Your financial information is never shared with third parties.",
    },
    {
      question: "What are your fees?",
      answer: "We only charge a percentage of successfully recovered VAT. No upfront fees or hidden costs - you only pay when you receive your refund.",
    },
  ],
  icons: {
    expand: {
      src: CLOUDINARY_IMAGES.FAQ.ADD_ICON,
      alt: "Expand answer",
    },
    collapse: {
      src: CLOUDINARY_IMAGES.FAQ.REMOVE_ICON,
      alt: "Collapse answer",
    },
  },
};
