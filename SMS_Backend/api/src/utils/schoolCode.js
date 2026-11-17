/** First three A–Z letters of school name, uppercase; pad with X if fewer than 3. */
export const schoolCodeFromName = (schoolName) => {
  const letters = String(schoolName || '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return (letters + 'XXX').slice(0, 3);
};

/** Two-digit year from a date (Gregorian calendar). */
export const yearCodeFromDate = (dateInput) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const y = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  return String(y).slice(-2);
};
