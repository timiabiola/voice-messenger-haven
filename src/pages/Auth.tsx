
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Phone, Mail } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [otpToken, setOtpToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
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

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as US phone number (1-XXX-XXX-XXXX)
    if (phoneNumber.length <= 1) return phoneNumber;
    if (phoneNumber.length <= 4) return `1-${phoneNumber.slice(1)}`;
    if (phoneNumber.length <= 7) return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4)}`;
    return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Convert formatted phone to E.164 format for Supabase
  const getE164Phone = (formattedPhone: string) => {
    const digits = formattedPhone.replace(/\D/g, '');
    return digits.length > 0 ? `+${digits}` : '';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Client-side password validation
    if (password.length < 6) {
      toast.error("Password Too Short", {
        description: "Password must be at least 6 characters long.",
      });
      setLoading(false);
      return;
    }
    
    try {
      if (authMethod === 'email') {
        // Email signup flow
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
      } else {
        // Phone signup flow
        const e164Phone = getE164Phone(phone);
        if (!e164Phone || e164Phone.length < 10) {
          throw new Error('Please enter a valid phone number');
        }

        const { data, error } = await supabase.auth.signUp({
          phone: e164Phone,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: e164Phone,
            },
          },
        });

        console.log('Phone signup response:', { data, error });

        if (error) throw error;

        if (data.user || data.session) {
          // Phone signup typically requires OTP verification
          setShowOtpVerification(true);
          toast.success("Verify Your Phone 📱", {
            description: "We've sent a verification code to your phone number. Please enter it below.",
            duration: 8000,
          });
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // Enhanced error handling with specific messages
      if (
        error.message?.toLowerCase().includes('already registered') || 
        error.message?.toLowerCase().includes('already exists') ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.message?.toLowerCase().includes('user already registered') ||
        error.code === '23505' || // PostgreSQL duplicate key error
        error.code === 'user_already_exists'
      ) {
        toast.error("Account Already Exists", {
          description: authMethod === 'email' 
            ? "This email address is already registered. Please sign in or use a different email."
            : "This phone number is already registered. Please sign in or use a different number.",
        });
      } else if (
        error.message?.toLowerCase().includes('email not confirmed') ||
        error.message?.toLowerCase().includes('unverified') ||
        error.message?.toLowerCase().includes('confirmation required')
      ) {
        toast.error("Verification Required", {
          description: authMethod === 'email'
            ? "An account with this email exists but hasn't been verified. Please check your email for the verification link."
            : "An account with this phone exists but hasn't been verified. Please check your SMS for the verification code.",
          duration: 8000,
        });
      } else if (
        error.message?.toLowerCase().includes('password should be at least') ||
        error.message?.toLowerCase().includes('password is too short') ||
        error.message?.toLowerCase().includes('weak password') ||
        (error.message?.toLowerCase().includes('password') && error.message?.toLowerCase().includes('characters'))
      ) {
        toast.error("Password Requirements", {
          description: "Password must be at least 6 characters long.",
        });
      } else if (error.message?.toLowerCase().includes('email') && error.message?.toLowerCase().includes('invalid')) {
        toast.error("Invalid Email", {
          description: "Please enter a valid email address.",
        });
      } else if (error.message?.toLowerCase().includes('phone') || error.message?.toLowerCase().includes('number')) {
        toast.error("Invalid Phone Number", {
          description: "Please enter a valid phone number with country code.",
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

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const e164Phone = getE164Phone(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Phone Verified! 🎉", {
          description: "Your phone number has been verified successfully.",
          duration: 3000,
        });
        
        // Update user profile with phone number
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ phone: e164Phone })
            .eq('id', data.user.id);
        }
        
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error("Verification Failed", {
        description: error.message || "Invalid verification code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let signInData;
      
      if (authMethod === 'email') {
        signInData = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        const e164Phone = getE164Phone(phone);
        if (!e164Phone || e164Phone.length < 10) {
          throw new Error('Please enter a valid phone number');
        }
        
        signInData = await supabase.auth.signInWithPassword({
          phone: e164Phone,
          password,
        });
      }

      const { data, error } = signInData;

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
          description: authMethod === 'email'
            ? "The email or password you entered is incorrect. Please try again."
            : "The phone number or password you entered is incorrect. Please try again.",
        });
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('Phone not confirmed')) {
        toast.error("Verification Required", {
          description: authMethod === 'email'
            ? "Please check your email and click the verification link before signing in."
            : "Please verify your phone number before signing in.",
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
        {showOtpVerification ? (
          // OTP Verification Card
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-amber-400">Verify Your Phone</CardTitle>
              <CardDescription className="text-zinc-400">
                Enter the verification code sent to {phone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtpVerification} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-400 text-black hover:bg-amber-300" 
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Phone'}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-300"
                  onClick={() => {
                    setShowOtpVerification(false);
                    setOtpCode('');
                  }}
                >
                  Back to Sign Up
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          // Main Auth Card
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
                    {/* Auth Method Toggle */}
                    <RadioGroup 
                      value={authMethod} 
                      onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}
                      className="flex justify-center gap-6 mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone-signin" />
                        <Label htmlFor="phone-signin" className="flex items-center gap-2 cursor-pointer">
                          <Phone className="w-4 h-4" />
                          Phone
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email-signin" />
                        <Label htmlFor="email-signin" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                      </div>
                    </RadioGroup>

                    {authMethod === 'email' ? (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    ) : (
                      <Input
                        type="tel"
                        placeholder="Phone Number (1-XXX-XXX-XXXX)"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    )}
                    
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                    {/* Auth Method Toggle */}
                    <RadioGroup 
                      value={authMethod} 
                      onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}
                      className="flex justify-center gap-6 mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone-signup" />
                        <Label htmlFor="phone-signup" className="flex items-center gap-2 cursor-pointer">
                          <Phone className="w-4 h-4" />
                          Phone
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email-signup" />
                        <Label htmlFor="email-signup" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                      </div>
                    </RadioGroup>

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
                    
                    {authMethod === 'email' ? (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    ) : (
                      <Input
                        type="tel"
                        placeholder="Phone Number (1-XXX-XXX-XXXX)"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    )}
                    
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
        )}
      </div>
    </div>
  );
};

export default Auth;
