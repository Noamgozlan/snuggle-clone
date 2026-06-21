import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Home, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
  username: z.string().min(3, "שם משתמש חייב להכיל לפחות 3 תווים"),
  password: z.string()
    .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
    .regex(/[A-Z]/, "הסיסמה חייבת להכיל לפחות אות גדולה אחת")
    .regex(/[a-z]/, "הסיסמה חייבת להכיל לפחות אות קטנה אחת")
    .regex(/[0-9]/, "הסיסמה חייבת להכיל לפחות ספרה אחת"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const Register = () => {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
      const validatedData = registerSchema.parse({
        email,
        username,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      const { error } = await signUp(validatedData.email, validatedData.password, {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        username: validatedData.username,
      });

      if (error) {
        let errorMessage = "שגיאה בהרשמה";
        
        if (error.message.includes("already registered")) {
          errorMessage = "משתמש עם אימייל זה כבר קיים במערכת";
        } else if (error.message.includes("invalid email")) {
          errorMessage = "כתובת אימייל לא תקינה";
        } else if (error.message.includes("password")) {
          errorMessage = "סיסמה חייבת להכיל לפחות 6 תווים";
        }

        toast({
          title: "שגיאה",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "נרשמת בהצלחה!",
        description: "ברוך הבא ל-GozlanJournal",
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

      {/* Registration Form */}
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
              <h1 className="text-2xl font-bold text-foreground mb-2">הרשמה למערכת</h1>
              <p className="text-muted-foreground text-sm">
                צור חשבון חדש כדי להתחיל לעקוב אחר העסקאות שלך
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
                <Label htmlFor="username">שם משתמש</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    className="text-left pl-8"
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="לפחות 6 תווים"
                  className="text-left"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">שם פרטי (אופציונלי)</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="שם פרטי"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">שם משפחה (אופציונלי)</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="שם משפחה"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    נרשם...
                  </>
                ) : (
                  "הרשמה"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              כבר יש לך חשבון?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                התחבר כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
