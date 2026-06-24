// Disables Next until the student has done this step's command in the
// "brown-fat" interactive (it sets the "heat" flag).
export default (r: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !r?.['brown-fat']?.['heat'];
};
