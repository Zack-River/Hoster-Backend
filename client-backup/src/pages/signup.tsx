import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

const COUNTRIES: Array<{ name: string; code: string; dial: string }> = [
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "Other", code: "OT", dial: "" },
];

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.name === country),
    [country]
  );

  const fullPhone = useMemo(() => {
    if (!phone) return undefined;
    const dial = selectedCountry?.dial || "";
    return dial ? `${dial} ${phone}` : phone;
  }, [phone, selectedCountry]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        firstName,
        lastName,
        country: country || undefined,
        phone: fullPhone,
        email,
        password,
      });
      const data = await res.json();
      await apiRequest("POST", "/api/auth/logout");
      return data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account created",
        description: "Please log in with your new account.",
      });
      setLocation("/login");
    },
    onError: (err: any) => {
      toast({
        title: "Sign up failed",
        description: err.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="signup-page">
      <nav className="h-14 flex items-center px-4 sm:px-6 border-b border-border/50">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-landing">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
        </Link>
        <div className="flex-1 text-center pr-16">
          <Link href="/">
            <span className="text-xl font-extrabold tracking-tight text-primary" data-testid="text-logo">Hoster</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight" data-testid="text-auth-heading">Create your account</h2>
            <p className="text-sm text-muted-foreground mt-2">Start managing your rentals smarter</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(); }} className="space-y-4" data-testid="form-signup">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-first" className="text-xs font-medium text-muted-foreground">First name</Label>
                <Input id="reg-first" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-reg-first-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-last" className="text-xs font-medium text-muted-foreground">Last name</Label>
                <Input id="reg-last" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-reg-last-name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs font-medium text-muted-foreground">Email address</Label>
              <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-reg-email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-card border-border rounded-md"
                  data-testid="input-reg-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="button-toggle-reg-password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Country (optional)</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-card border-border rounded-md" data-testid="select-reg-country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.name} data-testid={`option-country-${c.code.toLowerCase()}`}>
                      {c.name}{c.dial ? ` (${c.dial})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-phone" className="text-xs font-medium text-muted-foreground">Phone (optional)</Label>
              <div className="flex items-center gap-2">
                {selectedCountry?.dial && (
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0 min-w-[3rem]" data-testid="text-phone-dial-code">
                    {selectedCountry.dial}
                  </span>
                )}
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder={selectedCountry?.dial ? "Phone number" : "+1 (555) 000-0000"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-card border-border rounded-md"
                  data-testid="input-reg-phone"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox id="agree-terms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} className="mt-0.5" data-testid="checkbox-agree-terms" />
              <Label htmlFor="agree-terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                I agree to the <span className="text-primary font-medium">Terms & Conditions</span> and <span className="text-primary font-medium">Privacy Policy</span>
              </Label>
            </div>

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={!firstName || !lastName || !email || !password || !agreeTerms || registerMutation.isPending}
              data-testid="button-signup"
            >
              {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium" data-testid="link-to-login">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
