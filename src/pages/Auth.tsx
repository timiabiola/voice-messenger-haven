
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (session) {
        navigate('/', { replace: true });
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      console.log('Signup response:', { data, error });

      if (error) throw error;

      if (data.user && !data.session) {
        // User created but email not confirmed
        console.log('User created, email confirmation required');
        toast.success("Verify Your Email 📧", {
          description: "We've sent a verification link to your email. Please click it to activate your account. The email may take a few minutes to arrive.",
          duration: 10000, // Show for 10 seconds since it's important
        });
        
        // Clear form fields on success
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      } else if (data.user && data.session) {
        // User created and auto-signed in (if email confirmation is disabled)
        console.log('User created and auto-signed in');
        toast.success("Welcome! 🎉", {
          description: "Your account has been created successfully.",
          duration: 5000,
        });
        navigate('/', { replace: true });
      } else if (data.user) {
        // Fallback case - user created but unclear session state
        console.log('User created with unclear session state');
        toast.success("Account Created! 📧", {
          description: "Please check your email to verify your account.",
          duration: 8000,
        });
        
        // Clear form fields on success
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      
      // Enhanced error handling with specific messages
      if (
        error.message?.toLowerCase().includes('already registered') || 
        error.message?.toLowerCase().includes('already exists') ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.message?.toLowerCase().includes('user already registered') ||
        error.code === '23505' || // PostgreSQL duplicate key error
        error.code === 'user_already_exists'
      ) {
        toast.error("Email Already Taken", {
          description: "This email address is already registered. Please sign in or use a different email.",
        });
      } else if (
        error.message?.toLowerCase().includes('email not confirmed') ||
        error.message?.toLowerCase().includes('unverified') ||
        error.message?.toLowerCase().includes('confirmation required')
      ) {
        toast.error("Email Not Verified", {
          description: "An account with this email exists but hasn't been verified. Please check your email for the verification link.",
          duration: 8000,
        });
      } else if (error.message?.toLowerCase().includes('password') || error.message?.toLowerCase().includes('weak')) {
        toast.error("Password Requirements", {
          description: "Password must be at least 6 characters long.",
        });
      } else if (error.message?.toLowerCase().includes('email') && error.message?.toLowerCase().includes('invalid')) {
        toast.error("Invalid Email", {
          description: "Please enter a valid email address.",
        });
      } else {
        toast.error("Signup Error", {
          description: error.message || "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        console.log('Successfully signed in:', data.session);
        toast.success("Welcome back! 👋", {
          description: "You've successfully signed in.",
          duration: 3000,
        });
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Enhanced error handling for sign in
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid')) {
        toast.error("Invalid Credentials", {
          description: "The email or password you entered is incorrect. Please try again.",
        });
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Email Not Verified", {
          description: "Please check your email and click the verification link before signing in.",
          duration: 8000,
        });
      } else if (error.message?.includes('rate limit')) {
        toast.error("Too Many Attempts", {
          description: "Please wait a few minutes before trying again.",
        });
      } else {
        toast.error("Sign In Error", {
          description: error.message || "Unable to sign in. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4">
      <div className="w-full max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-amber-400">Welcome</CardTitle>
            <CardDescription className="text-zinc-400">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-400 text-black hover:bg-amber-300" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <Input
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-400 text-black hover:bg-amber-300" 
                    disabled={loading}
                  >
                    {loading ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
