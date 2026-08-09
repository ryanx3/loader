export function generateNormalizedPhonePT(phone: any): string {
  try {
    if (typeof phone !== "string" || phone.trim() === "") {
      return String(phone || "");
    }

    let digits = phone.replace(/\D/g, "");

    if (!digits) return "";

    while (digits.startsWith("00")) {
      digits = digits.substring(2);
    }

    if (digits.startsWith("351")) {
      digits = digits.substring(3);
    }

    if (digits.startsWith("0") && digits.length > 9) {
      digits = digits.substring(1);
    }

    if (digits.startsWith("351")) {
      digits = digits.substring(3);
    }

    if (digits.length === 9 && digits.startsWith("9")) {
      return digits;
    }

    let cleanedOriginal = phone.replace(/\D/g, "");

    if (cleanedOriginal.startsWith("351")) {
      cleanedOriginal = cleanedOriginal.substring(3);
    }
    while (cleanedOriginal.startsWith("00")) {
      cleanedOriginal = cleanedOriginal.substring(2);
    }

    return cleanedOriginal || phone;
  } catch {
    return String(phone || "");
  }
}
