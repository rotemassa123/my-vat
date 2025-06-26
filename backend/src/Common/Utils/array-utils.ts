/**
 * Removes duplicate values from an array.
 * @param array - Array of numbers
 * @returns Array without duplicates
 */

export function removeDuplicates(array: number[]): number[] {
  return Array.from(new Set(array));
}
