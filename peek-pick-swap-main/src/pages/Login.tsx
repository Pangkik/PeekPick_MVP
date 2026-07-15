import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Wordmark from "@/components/Wordmark";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuthActions } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, verify } = useAuthActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/swipe");
    } catch (err) {
      if (err instanceof ApiError && err.data?.needsVerification) {
        setNeedsVerification(true);
        toast.info("Check the server console for your verification code");
      } else {
        setFormError(err instanceof Error ? err.message : "Login failed");
      }
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
      toast.success("Verified! Welcome back.");
      navigate("/swipe");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Wordmark />
          </div>

          <div className="bg-surface-elevated border border-border rounded-3xl p-6">
            <h1 className="text-2xl font-black mb-2">Verify your email</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Enter the 6-digit code for <span className="text-foreground font-semibold">{email}</span>.
              <br />
              <span className="text-xs">Check the server console for your code.</span>
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="login-verify-code" className="self-start">Verification code</Label>
                <InputOTP id="login-verify-code" maxLength={6} value={code} onChange={setCode}>
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
                Verify & Sign In
              </button>

              <button
                type="button"
                onClick={() => setNeedsVerification(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Wordmark />
        </div>

        <div className="bg-surface-elevated border border-border rounded-3xl p-6">
          <h1 className="text-2xl font-black mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to keep trading.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p role="alert" className="text-sm text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <p role="alert" className="text-sm text-destructive">{fieldErrors.password}</p>}
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
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to PeekPick?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
