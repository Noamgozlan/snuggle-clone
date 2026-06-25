import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Home, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getHebrewAuthErrorMessage } from "@/lib/authErrors";

const forgotPasswordSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
});

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const validatedData = forgotPasswordSchema.parse({ email });
      const { error } = await resetPassword(validatedData.email);

      if (error) {
        toast({
          title: "שגיאה בשליחה",
          description: getHebrewAuthErrorMessage(error, "לא הצלחנו לשלוח קישור איפוס סיסמה."),
          variant: "destructive",
        });
        return;
      }

      setSentTo(validatedData.email);
      toast({
        title: "נשלח קישור איפוס",
        description: "בדוק את האימייל שלך כדי להגדיר סיסמה חדשה.",
      });
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
              <h1 className="text-2xl font-bold text-foreground mb-2">איפוס סיסמה</h1>
              <p className="text-muted-foreground text-sm">נשלח אליך קישור מאובטח להגדרת סיסמה חדשה</p>
            </div>

            {sentTo && (
              <Alert className="mb-5 border-primary/30 bg-primary/5">
                <MailCheck className="h-4 w-4 text-primary" />
                <AlertTitle>האימייל נשלח</AlertTitle>
                <AlertDescription>שלחנו קישור איפוס אל {sentTo}. בדוק גם את תיקיית הספאם.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="text-left"
                  dir="ltr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                שלח קישור איפוס
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
