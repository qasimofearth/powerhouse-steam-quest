// Disables Next until the student has done this step's command in the
// "atp-synthase" interactive (it sets the "pumped" flag).
export default (r: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !r?.['atp-synthase']?.['pumped'];
};
