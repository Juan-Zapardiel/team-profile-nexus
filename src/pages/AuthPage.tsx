import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getUsers, getUserFirstTimeEntryDate } from "@/integrations/harvest/client";
import { HarvestUser } from "@/integrations/harvest/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Password requirements regex
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&+\-])[A-Za-z\d@$!%*#?&+\-]{6,}$/;

const authFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(PASSWORD_REGEX, { 
      message: "Password must contain at least one letter, one number, and one special character" 
    }),
  confirmPassword: z.string().optional()
}).refine((data) => {
  // Only validate password confirmation if we're in signup mode
  if (data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AuthFormValues = z.infer<typeof authFormSchema>;

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    )}
    <span className={met ? "text-green-500" : "text-red-500"}>{text}</span>
  </div>
);

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingHarvest, setIsCheckingHarvest] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [harvestUsers, setHarvestUsers] = useState<HarvestUser[]>([]);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const passwordRequirements = {
    length: password.length >= 6,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*#?&+\-]/.test(password),
  };

  // Fetch Harvest users on component mount
  useEffect(() => {
    const fetchHarvestUsers = async () => {
      try {
        const users = await getUsers();
        setHarvestUsers(users);
      } catch (error) {
        console.error("Error fetching Harvest users:", error);
      }
    };
    fetchHarvestUsers();
  }, []);

  const isHarvestEmail = (email: string) => {
    return harvestUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  };

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      if (authMode === "login") {
        console.log('Attempting login...');
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        console.log('Login response:', { error });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            // Check if the email exists in Harvest
            if (isHarvestEmail(data.email)) {
              setUnregisteredEmail(data.email);
              setShowSignupDialog(true);
            } else {
              throw new Error("This email is not associated with any Harvest account");
            }
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
      } else if (authMode === "signup") {
        // Check if email is a Harvest email
        setIsCheckingHarvest(true);
        if (!isHarvestEmail(data.email)) {
          throw new Error("This email is not associated with any Harvest account");
        }
        setIsCheckingHarvest(false);

        // Find the Harvest user to get their full name and ID
        const harvestUser = harvestUsers.find(user => user.email.toLowerCase() === data.email.toLowerCase());
        if (!harvestUser) {
          throw new Error("Could not find Harvest user details");
        }

        console.log('Found Harvest user:', {
          id: harvestUser.id,
          name: `${harvestUser.first_name} ${harvestUser.last_name}`,
          email: harvestUser.email
        });

        // Get the user's first time entry date
        const firstTimeEntryDate = await getUserFirstTimeEntryDate(harvestUser.id);
        console.log('First time entry date:', firstTimeEntryDate);

        if (!firstTimeEntryDate) {
          throw new Error("No time entries found for this user in Harvest");
        }

        const userData = {
          name: harvestUser.first_name && harvestUser.last_name 
            ? `${harvestUser.first_name} ${harvestUser.last_name}`
            : harvestUser.first_name || harvestUser.last_name || "New User",
          job_title: "Team Member",
          location: "Unknown",
          start_date: firstTimeEntryDate,
        };

        console.log('Creating user with data:', userData);

        // Sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: userData,
            emailRedirectTo: `${window.location.origin}/auth?mode=confirm`,
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }
        
        if (!signUpData.user) {
          console.error('No user data returned from signup');
          throw new Error("No user data returned from signup");
        }

        console.log('User created:', signUpData.user.id);

        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account. You will be redirected to the login page.",
        });

        // Wait a moment before redirecting to login
        setTimeout(() => {
          setAuthMode("login");
          form.reset();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsCheckingHarvest(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignupFromDialog = () => {
    setShowSignupDialog(false);
    setAuthMode("signup");
    form.setValue("email", unregisteredEmail);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Humatica Experience Tracker</CardTitle>
          <CardDescription>
            {authMode === "login" ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "signup")}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CardContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full text-sm text-muted-foreground hover:text-primary"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Reset Link
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Forgot Password?
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="signup">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CardContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <div className="mt-2 space-y-1">
                          <PasswordRequirement 
                            met={passwordRequirements.length} 
                            text="At least 6 characters" 
                          />
                          <PasswordRequirement 
                            met={passwordRequirements.letter} 
                            text="At least one letter" 
                          />
                          <PasswordRequirement 
                            met={passwordRequirements.number} 
                            text="At least one number" 
                          />
                          <PasswordRequirement 
                            met={passwordRequirements.special} 
                            text="At least one special character (@$!%*#?&+-)" 
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isLoading || isCheckingHarvest}>
                    {isLoading || isCheckingHarvest ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>

      <AlertDialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              This email is associated with a Harvest account but hasn't been registered yet.
              Would you like to create an account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignupFromDialog}>
              Create Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuthPage;
