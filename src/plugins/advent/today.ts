/** Today's date in the association's time zone, as YYYY-MM-DD. */
export const todayInAmsterdam = (): string => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
