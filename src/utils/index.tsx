export function shortenString(str:string, length = 4) {
  if (str.length <= 8) {
    return str;
  }
  const start = str.slice(0, length);
  const end = str.slice(-length);
  return `${start}...${end}`;
}