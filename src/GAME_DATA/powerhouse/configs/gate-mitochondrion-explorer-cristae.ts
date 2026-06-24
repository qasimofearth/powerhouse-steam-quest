// Disables Next until the student has done this step's command in the
// "mitochondrion-explorer" interactive (it sets the "cristae" flag).
export default (r: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !r?.['mitochondrion-explorer']?.['cristae'];
};
