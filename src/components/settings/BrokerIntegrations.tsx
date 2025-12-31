import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Unlink, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import tradovateLogo from "@/assets/brokers/tradovate.png";

interface BrokerConnection {
  id: string;
  broker_name: string;
  account_id: string | null;
  account_name: string | null;
  username: string | null;
  environment: string;
  is_active: boolean;
  last_sync_at: string | null;
  portfolio_id: string | null;
}

export function BrokerIntegrations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { portfolios } = usePortfolio();
  
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [appId, setAppId] = useState("");
  const [cid, setCid] = useState("");
  const [sec, setSec] = useState("");

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!username || !password) {
      toast({
        title: "שגיאה",
        description: "נא להזין שם משתמש וסיסמה",
        variant: "destructive",
      });
      return;
    }

    if (!cid || !sec) {
      toast({
        title: "שגיאה",
        description: "נא להזין CID ו-Secret מ-Tradovate (בהגדרות מתקדמות)",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('sync-tradovate', {
        body: {
          action: 'connect',
          username,
          password,
          environment,
          portfolioId: portfolioId || null,
          appId: appId || 'Lovable Trading Journal',
          cid,
          sec,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "התחברות בוצעה בהצלחה!",
        description: `חשבון ${response.data.connection.account_name} חובר בהצלחה`,
      });

      setShowForm(false);
      setUsername("");
      setPassword("");
      setCid("");
      setSec("");
      fetchConnections();
    } catch (error: any) {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "לא הצלחנו להתחבר ל-Tradovate",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (connection: BrokerConnection) => {
    if (!password) {
      toast({
        title: "נדרשת סיסמה",
        description: "נא להזין את הסיסמה לסנכרון",
        variant: "destructive",
      });
      setShowForm(true);
      return;
    }

    setSyncing(true);
    try {
      const response = await supabase.functions.invoke('sync-tradovate', {
        body: {
          action: 'sync',
          connectionId: connection.id,
          username: connection.username,
          password,
          appId: appId || 'Lovable Trading Journal',
          cid,
          sec,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "סנכרון הושלם!",
        description: `יובאו ${response.data.imported} עסקאות חדשות`,
      });

      fetchConnections();
    } catch (error: any) {
      toast({
        title: "שגיאה בסנכרון",
        description: error.message || "לא הצלחנו לסנכרן עסקאות",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await supabase.functions.invoke('sync-tradovate', {
        body: {
          action: 'disconnect',
          connectionId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "החשבון נותק",
        description: "החיבור ל-Tradovate הוסר בהצלחה",
      });

      fetchConnections();
    } catch (error: any) {
      toast({
        title: "שגיאה בניתוק",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const tradovateConnection = connections.find(c => c.broker_name === 'tradovate');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>חיבור לברוקר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          חיבור לברוקר
        </CardTitle>
        <CardDescription>
          חבר את חשבון המסחר שלך לייבוא אוטומטי של עסקאות
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tradovate Card */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={tradovateLogo} 
              alt="Tradovate" 
              className="h-10 w-10 rounded-lg object-contain bg-white p-1"
            />
            <div className="flex-1">
              <h3 className="font-semibold">Tradovate</h3>
              <p className="text-sm text-muted-foreground">פלטפורמת מסחר בחוזים עתידיים</p>
            </div>
            {tradovateConnection ? (
              <Badge variant="default" className="bg-green-600">מחובר</Badge>
            ) : (
              <Badge variant="secondary">לא מחובר</Badge>
            )}
          </div>

          {tradovateConnection ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">חשבון:</span>
                  <span className="font-medium">{tradovateConnection.account_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">סביבה:</span>
                  <Badge variant="outline">
                    {tradovateConnection.environment === 'live' ? 'Live' : 'Demo'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">סנכרון אחרון:</span>
                  <span>
                    {tradovateConnection.last_sync_at 
                      ? format(new Date(tradovateConnection.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: he })
                      : 'טרם בוצע'}
                  </span>
                </div>
              </div>

              {/* Sync credentials form */}
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  הזן את פרטי ההתחברות לסנכרון עסקאות:
                </p>
                <div className="space-y-2">
                  <Label htmlFor="sync-password">סיסמה</Label>
                  <div className="relative">
                    <Input
                      id="sync-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="הסיסמה שלך ב-Tradovate"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="sync-cid">CID</Label>
                    <Input
                      id="sync-cid"
                      value={cid}
                      onChange={(e) => setCid(e.target.value)}
                      placeholder="Client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-sec">Secret</Label>
                    <Input
                      id="sync-sec"
                      type="password"
                      value={sec}
                      onChange={(e) => setSec(e.target.value)}
                      placeholder="API Secret"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSync(tradovateConnection)}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 ml-2" />
                  )}
                  סנכרן עכשיו
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDisconnect(tradovateConnection.id)}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">שם משתמש</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="שם המשתמש ב-Tradovate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="הסיסמה שלך"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="environment">סביבה</Label>
                    <Select value={environment} onValueChange={(v) => setEnvironment(v as "demo" | "live")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">פורטפוליו יעד</Label>
                    <Select value={portfolioId} onValueChange={setPortfolioId}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר פורטפוליו" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolios.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced settings */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  הגדרות מתקדמות (API Keys)
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      כדי לחבר את Tradovate, צריך ליצור API Key ב-
                      <a 
                        href="https://trader.tradovate.com/#/settings/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline mx-1"
                      >
                        הגדרות Tradovate
                      </a>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="appId">App ID (אופציונלי)</Label>
                      <Input
                        id="appId"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="Lovable Trading Journal"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cid">CID (Client ID) *</Label>
                        <Input
                          id="cid"
                          value={cid}
                          onChange={(e) => setCid(e.target.value)}
                          placeholder="Client ID מ-Tradovate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sec">Secret *</Label>
                        <Input
                          id="sec"
                          type="password"
                          value={sec}
                          onChange={(e) => setSec(e.target.value)}
                          placeholder="API Secret"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex-1"
                >
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 ml-2" />
                  )}
                  התחבר
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Link2 className="h-4 w-4 ml-2" />
              חבר חשבון Tradovate
            </Button>
          )}
        </div>

        {/* Future brokers placeholder */}
        <div className="border rounded-lg p-4 opacity-50">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-lg">🔜</span>
            </div>
            <div>
              <h3 className="font-semibold">ברוקרים נוספים בקרוב</h3>
              <p className="text-sm text-muted-foreground">Rithmic, NinjaTrader, Interactive Brokers...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
