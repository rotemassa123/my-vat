import { useRef, useEffect, useState } from 'react';

const GRID_GAP = 24; // 1.5rem = 24px
const CONTENT_PADDING_LEFT = 24; // px

// Screen size breakpoints for column count
const getColumnCount = (width: number): number => {
  if (width >= 1920) return 8; // Massive screens (24" and above)
  if (width >= 1440) return 6; // Big screens
  return 4; // Small screens
};

export const useAnalysisGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [unitSize, setUnitSize] = useState(240);

  useEffect(() => {
    const calculateGrid = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.parentElement?.getBoundingClientRect().width || window.innerWidth;
        // Available width = container width - left padding
        const availableWidth = containerWidth - CONTENT_PADDING_LEFT;
        
        // Determine number of columns based on screen size
        const numColumns = getColumnCount(containerWidth);
        
        // Calculate unit size so row fills entire available width
        // Formula: unitSize = (availableWidth - ((numColumns - 1) * gap)) / numColumns
        const calculatedUnitSize = (availableWidth - ((numColumns - 1) * GRID_GAP)) / numColumns;
        
        setColumns(numColumns);
        setUnitSize(calculatedUnitSize);
      }
    };

    calculateGrid();
    const resizeObserver = new ResizeObserver(calculateGrid);
    if (gridRef.current?.parentElement) {
      resizeObserver.observe(gridRef.current.parentElement);
    }
    window.addEventListener('resize', calculateGrid);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateGrid);
    };
  }, []);

  return {
    gridRef,
    columns,
    unitSize,
  };
};

