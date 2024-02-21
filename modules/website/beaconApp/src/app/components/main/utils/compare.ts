export const compare = (
  a: number | string,
  b: number | string,
  isAsc: boolean
): any => {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
};
