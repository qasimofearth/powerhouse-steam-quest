// Disables the scene's Next button until the student has engaged with the
// "vo2max-lab" interactive (it writes { completed: true } to interactiveResponses).
export default (interactiveResponses: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !interactiveResponses?.['vo2max-lab']?.completed;
};
