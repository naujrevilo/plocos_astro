/**
 * @file src/lib/date.ts
 * @description This file contains date-related utility functions.
 */

/**
 * Parses a date and returns a Date object. If the date is invalid, it returns the current date.
 * @param date The date to parse.
 * @returns A valid Date object.
 */
export function parseDate(date: any): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return new Date();
}
