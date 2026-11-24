// Vite-Import `…?raw` (Dateiinhalt als Text), z. B. das CSS der Seite für die Hero-Vorschau.
declare module '*?raw' {
  const content: string;
  export default content;
}
