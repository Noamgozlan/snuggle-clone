import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Home, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getHebrewAuthErrorMessage } from "@/lib/authErrors";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
      .regex(/[A-Z]/, "הסיסמה חייבת להכיל לפחות אות גדולה אחת")
      .regex(/[a-z]/, "הסיסמה חייבת להכיל לפחות אות קטנה אחת")
      .regex(/[0-9]/, "הסיסמה חייבת להכיל לפחות ספרה אחת")
      .regex(/[^A-Za-z0-9]/, "הסיסמה חייבת להכיל לפחות סימן מיוחד אחד"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "הסיסמאות לא תואמות",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const validatedData = resetPasswordSchema.parse({ password, confirmPassword });
      const { error } = await updatePassword(validatedData.password);

      if (error) {
        toast({
          title: "שגיאה בעדכון הסיסמה",
          description: getHebrewAuthErrorMessage(error, "לא הצלחנו לעדכן את הסיסמה."),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "הסיסמה עודכנה",
        description: "אפשר להתחבר עם הסיסמה החדשה.",
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "שגיאה בנתונים",
          description: err.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="h-4 w-4" />
          <span>חזרה להתחברות</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 flex items-center justify-center">
                <Home className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-primary text-sm mb-2">Gozlan Journal</p>
              <h1 className="text-2xl font-bold text-foreground mb-2">הגדרת סיסמה חדשה</h1>
              <p className="text-muted-foreground text-sm">בחר סיסמה חזקה שלא השתמשת בה בעבר</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה חדשה</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="לפחות 8 תווים (Aa1!)"
                  className="text-left"
                  dir="ltr"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="הזן שוב את הסיסמה"
                  className="text-left"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">חובה: אות גדולה, אות קטנה, מספר וסימן מיוחד.</p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                עדכן סיסמה
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
