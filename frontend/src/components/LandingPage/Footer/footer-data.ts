import { CLOUDINARY_IMAGES } from "../../../consts/cloudinary";

export const footerContent = {
  logo: {
    src: CLOUDINARY_IMAGES.LOGO.MAIN,
    alt: "MyVAT Logo",
    description: "Global VAT Recovery Made Simple",
  },
  contactLinks: [
    { name: "Phone", details: "+1 (555) 123-4567" },
    { name: "Email", details: "support@myvat.com" },
  ],
  socialIcons: [
    {
      src: CLOUDINARY_IMAGES.SOCIAL.FACEBOOK,
      alt: "Facebook",
    },
    {
      src: CLOUDINARY_IMAGES.SOCIAL.INSTAGRAM,
      alt: "Instagram",
    },
    {
      src: CLOUDINARY_IMAGES.SOCIAL.TIKTOK,
      alt: "TikTok",
    },
  ],
};
