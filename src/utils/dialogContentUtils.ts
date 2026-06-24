/**
 * Utility class to capture the functions that are related to updates in dialog content.
 */

export const toTitleCase = (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1));
};