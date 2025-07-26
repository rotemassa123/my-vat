 b# BookADemo Component

## Overview
The BookADemo component is a new section added to the landing page that encourages users to schedule a demo or contact the company. It features a 3D illustration and call-to-action buttons.

## Design
Based on the Figma design, this component includes:
- A 3D illustration on the left side (SVG-based)
- Main title: "Ready to reclaim more with less effort?"
- Subtitle: "Book a demo or speak with a VAT expert today"
- Two CTA buttons: "Schedule Demo" and "Contact Us"

## Implementation Details

### Component Structure
- `book-a-demo.tsx` - Main React component
- `book-a-demo.module.scss` - Styling with SCSS modules
- `README.md` - This documentation

### Features
- Responsive design that adapts to different screen sizes
- 3D illustration using SVG paths from Figma
- Glassmorphism effects on buttons with backdrop blur
- Proper typography using Poppins font family
- Hover effects on interactive elements

### Navigation Integration
- Added to navigation data with section ID: `book-a-demo`
- Included in header menu as "Book Demo"
- Added to footer navigation links

### Styling Approach
- Uses SCSS modules for component-scoped styling
- Follows the existing design system patterns
- Implements responsive breakpoints for mobile, tablet, and desktop
- Uses Material-UI components for consistency

## Usage
```tsx
import BookADemo from './BookADemo/book-a-demo';

// In the landing page
<BookADemo id={SECTION_IDS.BOOK_A_DEMO} />
```

## Accessibility
- Proper semantic HTML structure with `<section>` element
- Accessible button labels and hover states
- Responsive design ensures usability across devices 