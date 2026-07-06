/** "enero 2026" / "January 2026" — usado en el perfil y en la tarjeta de reputación. */
export function formatMemberSince(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
