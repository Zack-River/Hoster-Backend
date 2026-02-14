import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { email, password });

      const checkRes = await fetch("/api/admin/auth-check");
      const checkData = await checkRes.json();

      if (!checkData.isAdmin) {
        await apiRequest("POST", "/api/auth/logout");
        toast({
          title: "Access denied",
          description: "This account does not have admin privileges.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { email, password });

      const setupRes = await apiRequest("POST", "/api/admin/setup");
      const setupData = await setupRes.json();

      if (setupData.success) {
        toast({ title: "Admin setup complete", description: "You are now the admin." });
        onSuccess();
      } else {
        await apiRequest("POST", "/api/auth/logout");
        toast({
          title: "Setup failed",
          description: setupData.message || "An admin already exists. Please log in instead.",
          variant: "destructive",
        });
        setShowSetup(false);
      }
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error?.message || "Could not complete admin setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {showSetup ? (
              <ShieldCheck className="h-6 w-6 text-primary" />
            ) : (
              <Lock className="h-6 w-6 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-primary" data-testid="text-admin-title">Hoster</h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-admin-subtitle">
            {showSetup ? "First-Time Admin Setup" : "Admin Panel"}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={showSetup ? handleSetup : handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@tryhoster.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-admin-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email.trim() || !password.trim()}
                data-testid="button-admin-login"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {showSetup ? "Set Up Admin Account" : "Sign in to Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          {showSetup ? (
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => setShowSetup(false)}
              data-testid="button-switch-to-login"
            >
              Already set up? Sign in instead
            </button>
          ) : (
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => setShowSetup(true)}
              data-testid="button-switch-to-setup"
            >
              First time? Set up admin account
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
