export function generateGenId(prefix = ""): string {
  const ts = Date.now().toString(16);
  const random = Math.floor(Math.random() * 0xfffff).toString(16);
  return prefix + ts + random;
}
