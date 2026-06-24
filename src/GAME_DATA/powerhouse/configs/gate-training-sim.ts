// Disables the scene's Next button until the student has engaged with the
// "training-sim" interactive (it writes { completed: true } to interactiveResponses).
export default (interactiveResponses: Record<string, Record<string, string | number | boolean | null>>): boolean => {
  return !interactiveResponses?.['training-sim']?.completed;
};
