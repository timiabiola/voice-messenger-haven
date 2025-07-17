
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
import { Phone, Mail, RefreshCw } from 'lucide-react';
import { formatPhoneForDisplay, formatPhoneToE164, isValidPhoneNumber, getPhoneErrorMessage } from '@/utils/phone';
import { logger } from '@/utils/logger';
import { validatePassword, getPasswordRequirementsText, getPasswordStrength } from '@/utils/password-validation';
import { rateLimiter } from '@/utils/rate-limiter';

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
  const [resendingOtp, setResendingOtp] = useState(false);
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
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
      logger.log('Auth state changed:', event);
      if (session) {
        navigate('/', { replace: true });
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneForDisplay(e.target.value);
    setPhone(formatted);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Rate limiting check
    const identifier = authMethod === 'email' ? email : phone;
    const limitCheck = rateLimiter.checkLimit(identifier, 'signup');
    
    if (!limitCheck.allowed) {
      const blockedUntil = limitCheck.blockedUntil;
      toast.error("Too Many Attempts", {
        description: blockedUntil 
          ? `Please try again after ${blockedUntil.toLocaleTimeString()}`
          : "Please wait before trying again.",
      });
      setLoading(false);
      return;
    }
    
    // Client-side password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error("Password Requirements Not Met", {
        description: passwordValidation.errors[0], // Show first error
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

        logger.log('Email signup response');

        if (error) throw error;

        if (data.user && !data.session) {
          // User created but email not confirmed
          logger.log('User created, email confirmation required');
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
          logger.log('User created and auto-signed in');
          toast.success("Welcome! 🎉", {
            description: "Your account has been created successfully.",
            duration: 5000,
          });
          // Reset rate limit on successful signup
          rateLimiter.reset(identifier, 'signup');
          navigate('/', { replace: true });
        } else if (data.user) {
          // Fallback case - user created but unclear session state
          logger.log('User created with unclear session state');
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
        const e164Phone = formatPhoneToE164(phone);
        const phoneError = getPhoneErrorMessage(phone);
        if (phoneError) {
          throw new Error(phoneError);
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

        logger.log('Phone signup initiated');

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
      logger.error('Signup error:', error.message);
      
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
          description: getPasswordRequirementsText(),
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

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const e164Phone = formatPhoneToE164(phone);
      const { error } = await supabase.auth.resend({
        type: 'sms',
        phone: e164Phone,
      });

      if (error) throw error;

      toast.success("Code Resent! 📱", {
        description: "A new verification code has been sent to your phone.",
        duration: 5000,
      });
    } catch (error: any) {
      logger.error('Resend OTP error:', error.message);
      toast.error("Resend Failed", {
        description: error.message || "Could not resend verification code. Please try again.",
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const e164Phone = formatPhoneToE164(phone);
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
        
        // If this was a verification for existing user, try to sign in
        if (needsPhoneVerification && password) {
          const signInResult = await supabase.auth.signInWithPassword({
            phone: e164Phone,
            password,
          });
          
          if (signInResult.error) {
            throw signInResult.error;
          }
        }
        
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      logger.error('OTP verification error:', error.message);
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
    
    // Rate limiting check
    const identifier = authMethod === 'email' ? email : phone;
    const limitCheck = rateLimiter.checkLimit(identifier, 'signin');
    
    if (!limitCheck.allowed) {
      const blockedUntil = limitCheck.blockedUntil;
      toast.error("Too Many Login Attempts", {
        description: blockedUntil 
          ? `Account temporarily locked. Try again after ${blockedUntil.toLocaleTimeString()}`
          : "Please wait before trying again.",
      });
      setLoading(false);
      return;
    }
    
    try {
      let signInData;
      
      if (authMethod === 'email') {
        signInData = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        const e164Phone = formatPhoneToE164(phone);
        const phoneError = getPhoneErrorMessage(phone);
        if (phoneError) {
          throw new Error(phoneError);
        }
        
        signInData = await supabase.auth.signInWithPassword({
          phone: e164Phone,
          password,
        });
      }

      const { data, error } = signInData;

      if (error) throw error;

      if (data.session) {
        logger.log('Successfully signed in');
        toast.success("Welcome back! 👋", {
          description: "You've successfully signed in.",
          duration: 3000,
        });
        // Reset rate limit on successful signin
        rateLimiter.reset(identifier, 'signin');
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      logger.error('Login error:', error.message);
      
      // Enhanced error handling for sign in
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid')) {
        toast.error("Invalid Credentials", {
          description: authMethod === 'email'
            ? "The email or password you entered is incorrect. Please try again."
            : "The phone number or password you entered is incorrect. Please try again.",
        });
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('Phone not confirmed')) {
        if (authMethod === 'phone') {
          // For phone, show OTP verification screen
          setNeedsPhoneVerification(true);
          setShowOtpVerification(true);
          toast.info("Phone Verification Required", {
            description: "Your phone number needs to be verified. We'll send you a verification code.",
            duration: 6000,
          });
          
          // Automatically resend OTP
          handleResendOtp();
        } else {
          toast.error("Email Verification Required", {
            description: "Please check your email and click the verification link before signing in.",
            duration: 8000,
          });
        }
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
                  variant="outline"
                  className="w-full text-zinc-400 hover:text-zinc-300 border-zinc-700"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                >
                  {resendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-300"
                  onClick={() => {
                    setShowOtpVerification(false);
                    setOtpCode('');
                    setNeedsPhoneVerification(false);
                  }}
                >
                  Back to {needsPhoneVerification ? 'Sign In' : 'Sign Up'}
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
                    
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      {password && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  getPasswordStrength(password) === 'weak' ? 'w-1/3 bg-red-500' :
                                  getPasswordStrength(password) === 'medium' ? 'w-2/3 bg-yellow-500' :
                                  'w-full bg-green-500'
                                }`}
                              />
                            </div>
                            <span className={`text-xs ${
                              getPasswordStrength(password) === 'weak' ? 'text-red-500' :
                              getPasswordStrength(password) === 'medium' ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>
                              {getPasswordStrength(password)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {getPasswordRequirementsText()}
                          </p>
                        </>
                      )}
                    </div>
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
                    
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      {password && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  getPasswordStrength(password) === 'weak' ? 'w-1/3 bg-red-500' :
                                  getPasswordStrength(password) === 'medium' ? 'w-2/3 bg-yellow-500' :
                                  'w-full bg-green-500'
                                }`}
                              />
                            </div>
                            <span className={`text-xs ${
                              getPasswordStrength(password) === 'weak' ? 'text-red-500' :
                              getPasswordStrength(password) === 'medium' ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>
                              {getPasswordStrength(password)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {getPasswordRequirementsText()}
                          </p>
                        </>
                      )}
                    </div>
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
