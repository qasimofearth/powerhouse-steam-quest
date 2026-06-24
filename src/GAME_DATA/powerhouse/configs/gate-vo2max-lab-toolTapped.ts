// Disables Next until the student has done this step's command in the
// "vo2max-lab" interactive (it sets the "toolTapped" flag).
export default (r: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !r?.['vo2max-lab']?.['toolTapped'];
};
