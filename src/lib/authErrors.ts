import { AuthError } from "@supabase/supabase-js";

export const getHebrewAuthErrorMessage = (error: unknown, fallback: string) => {
  const authError = error as Partial<AuthError> & { code?: string; error_code?: string };
  const rawMessage = authError?.message || "";
  const message = rawMessage.toLowerCase();
  const code = authError?.code || authError?.error_code || "";

  if (
    code === "weak_password" ||
    code === "weak_password_detected" ||
    message.includes("weak password") ||
    message.includes("password should") ||
    message.includes("password must") ||
    message.includes("pwned") ||
    message.includes("known to be") ||
    message.includes("compromised") ||
    message.includes("breached") ||
    message.includes("leaked") ||
    message.includes("haveibeenpwned")
  ) {
    return "הסיסמה חלשה או דלפה בעבר. בחר סיסמה ייחודית וחזקה יותר עם אות גדולה, אות קטנה, מספר וסימן מיוחד.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already")
  ) {
    return "כבר קיים חשבון עם האימייל הזה. אפשר להתחבר או לאפס סיסמה.";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("not confirmed") ||
    message.includes("confirm your email")
  ) {
    return "צריך לאמת את כתובת האימייל לפני התחברות. בדוק את תיבת הדואר והספאם, או שלח קישור אימות חדש.";
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "אימייל או סיסמה שגויים.";
  }

  if (message.includes("rate limit") || message.includes("too many") || code === "over_email_send_rate_limit") {
    return "בוצעו יותר מדי ניסיונות בזמן קצר. המתן כמה דקות ונסה שוב.";
  }

  if (message.includes("invalid email") || code === "email_address_invalid") {
    return "כתובת האימייל לא תקינה.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "הרשמה כבויה כרגע. נסה שוב מאוחר יותר.";
  }

  return rawMessage || fallback;
};
