
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a user's name to show only first name and last initial for privacy
 * Examples:
 * - "John Doe" → "John D."
 * - "Jane" → "Jane"
 * - null/undefined → "User"
 */
export function formatNameWithInitial(firstName: string | null, lastName: string | null): string {
  // If no first name, return generic "User"
  if (!firstName || firstName.trim() === '') {
    return 'User';
  }

  const cleanFirstName = firstName.trim();
  
  // If no last name, return just the first name
  if (!lastName || lastName.trim() === '') {
    return cleanFirstName;
  }

  const cleanLastName = lastName.trim();
  
  // Get the first character of the last name and add a period
  const lastInitial = cleanLastName.charAt(0).toUpperCase() + '.';
  
  return `${cleanFirstName} ${lastInitial}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
