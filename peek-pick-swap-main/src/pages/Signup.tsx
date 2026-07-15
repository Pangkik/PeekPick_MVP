import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Wordmark from "@/components/Wordmark";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuthActions } from "@/hooks/useAuth";

type FieldErrors = { name?: string; email?: string; password?: string };

export default function Signup() {
  const navigate = useNavigate();
  const { signup, verify } = useAuthActions();

  const [step, setStep] = useState<"signup" | "verify">("signup");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const validate = () => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { needsVerification } = await signup(name, email, password);
      if (needsVerification) {
        toast.info("Check the server console for your verification code");
        setStep("verify");
      } else {
        toast.success("Account created — log in to continue");
        navigate("/login");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    if (code.length !== 6) {
      setVerifyError("Enter the 6-digit code");
      return;
    }
    setVerifyLoading(true);
    try {
      await verify(email, code);
      toast.success("Account verified!");
      navigate("/onboarding");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark />
        </div>

        {step === "signup" ? (
          <div className="bg-surface-elevated border border-border rounded-3xl p-6">
            <h1 className="text-2xl font-black mb-1">Create your account</h1>
            <p className="text-muted-foreground text-sm mb-6">Join the swap. No money, ever.</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && <p role="alert" className="text-sm text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p role="alert" className="text-sm text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password ? (
                  <p role="alert" className="text-sm text-destructive">{fieldErrors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">At least 8 characters</p>
                )}
              </div>

              {formError && (
                <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-full shadow-green hover:bg-primary-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-border rounded-3xl p-6">
            <h1 className="text-2xl font-black mb-2">Verify your email</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Enter the 6-digit code for <span className="text-foreground font-semibold">{email}</span>.
              <br />
              <span className="text-xs">Check the server console for your code.</span>
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="signup-verify-code" className="self-start">Verification code</Label>
                <InputOTP id="signup-verify-code" maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {verifyError && (
                  <p role="alert" className="text-sm text-destructive self-start">{verifyError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-full shadow-green hover:bg-primary-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
              >
                {verifyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify & Continue
              </button>

              <button
                type="button"
                onClick={() => setStep("signup")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
