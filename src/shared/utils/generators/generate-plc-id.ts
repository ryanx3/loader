export function generatePlcId(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const datePart = `${year}${month}${day}`;

  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(7, "0");

  return `${datePart}_${randomPart}`;
}
