export const measurePerformance = async (
  label: string,
  fn: () => Promise<any>
) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[PERFORMANCE] ${label}: ${end - start}ms`);
  return result;
};
