export type Review = {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: {
    src: string;
    alt: string;
  };
}; 