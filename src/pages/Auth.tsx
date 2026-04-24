import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import plfaLogo from '@/assets/plfa-logo.jpeg';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isForgotPassword) {
      const emailResult = z.string().trim().email().safeParse(email);
      if (!emailResult.success) {
        setErrors({ email: 'Please enter a valid email address' });
        return;
      }
      setIsSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setIsSubmitting(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'A password reset link has been sent to your email.' });
        setIsForgotPassword(false);
      }
      return;
    }

    // Validate input
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive"
          });
        } else {
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          navigate('/admin');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message.includes("already registered")
              ? "This email is already registered. Try logging in instead."
              : error.message,
            variant: "destructive"
          });
        } else {
          toast({ 
            title: "Account created!", 
            description: "You can now log in. Note: Admin access requires manual approval." 
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to app</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={plfaLogo} 
              alt="PLFA Logo" 
              className="w-20 h-20 mx-auto rounded-full object-cover shadow-glow mb-4"
            />
            <h1 className="text-2xl font-display tracking-wide text-foreground">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Admin Login' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isForgotPassword ? 'Enter your email to receive a reset link' : isLogin ? 'Access the admin dashboard' : 'Sign up for an account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@plfa.com"
                  className="pl-10 bg-secondary border-border"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {!isForgotPassword && (
            <div>
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-secondary border-border"
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isForgotPassword ? 'Sending...' : isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>

            {isLogin && !isForgotPassword && (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setErrors({}); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </button>
            )}
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setErrors({}); }}
                className="text-primary hover:underline"
                disabled={isSubmitting}
              >
                Back to sign in
              </button>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="ml-1 text-primary hover:underline"
                  disabled={isSubmitting}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
