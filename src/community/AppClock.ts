/** Central app wall clock; local until an authenticated time source is configured. */
export const AppClock={now:():Date=>new Date(),externallyTrusted:false};
