import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Home, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = loginSchema.parse({ email, password });

      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        let errorMessage = "שגיאה בהתחברות";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "אימייל או סיסמה שגויים";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "יש לאמת את כתובת האימייל לפני ההתחברות";
        }

        toast({
          title: "שגיאה",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "התחברת בהצלחה!",
        description: "ברוך הבא חזרה",
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back to site link */}
      <div className="p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>חזרה לאתר</span>
        </Link>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 flex items-center justify-center">
                <Home className="h-10 w-10 text-primary" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-primary text-sm mb-2">🏠 הבית שבו משקיעים הופכים למקצוענים</p>
              <h1 className="text-2xl font-bold text-foreground mb-2">התחברות למערכת</h1>
              <p className="text-muted-foreground text-sm">
                התחבר לחשבון שלך כדי להמשיך לעקוב אחר העסקאות
              </p>
            </div>

            {/* Form */}
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">סיסמה</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    שכחת סיסמה?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="הזן את הסיסמה שלך"
                  className="text-left"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    מתחבר...
                  </>
                ) : (
                  "התחברות"
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              אין לך חשבון?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                הירשם עכשיו
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
