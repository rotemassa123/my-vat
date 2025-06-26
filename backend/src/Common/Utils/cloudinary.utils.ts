export function extractPublicId(fullUrl: string): string | null {
  const regex = /upload\/(?:v\d+\/)?([^?#]+)/;
  const match = fullUrl.match(regex);
  return match ? decodeURI(match[1]) : null;
}
