import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, studentRegistrationSchema, type StudentRegistration } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserPlus, LogIn } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<StudentRegistration>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "student",
      department: undefined,
      year: undefined,
      sinNumber: "",
    },
  });

  // Redirect if already logged in - use useEffect to avoid setState during render
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLogin = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onRegister = async (data: StudentRegistration) => {
    try {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...registerData } = data;
      registerData.username = data.sinNumber || ""; // Use SIN number as username
      
      await registerMutation.mutateAsync(registerData);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-100 px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Student Leave Portal</h1>
            <p className="text-muted-foreground mt-2">Manage leave requests efficiently</p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" data-testid="form-login">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID / Staff ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your ID" 
                                {...field} 
                                data-testid="input-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 mt-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" data-testid="form-register">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                {...field} 
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-year">
                                    <SelectValue placeholder="Select Year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">First Year</SelectItem>
                                  <SelectItem value="2">Second Year</SelectItem>
                                  <SelectItem value="3">Third Year</SelectItem>
                                  <SelectItem value="4">Fourth Year</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-department">
                                    <SelectValue placeholder="Select Dept" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CSE">CSE</SelectItem>
                                  <SelectItem value="AIDS">AI&DS</SelectItem>
                                  <SelectItem value="ECE">ECE</SelectItem>
                                  <SelectItem value="EEE">EEE</SelectItem>
                                  <SelectItem value="MECH">MECH</SelectItem>
                                  <SelectItem value="CIVIL">CIVIL</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="sinNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIN Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your SIN number" 
                                {...field}
                                value={field.value || ""}
                                data-testid="input-sin"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create password" 
                                {...field} 
                                data-testid="input-register-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm password" 
                                {...field} 
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {registerMutation.isPending ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero */}
        <div className="hidden lg:block">
          <div className="text-center space-y-6">
            <div className="mx-auto h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Welcome to</h2>
              <h3 className="text-3xl font-semibold text-primary">Student Leave Management</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Streamline your leave requests with our comprehensive management system. 
                Efficient, transparent, and user-friendly.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-sm">
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg mb-2">
                  <span className="text-primary font-semibold">Students</span>
                </div>
                <p className="text-muted-foreground">Submit requests easily</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg mb-2">
                  <span className="text-primary font-semibold">Teachers</span>
                </div>
                <p className="text-muted-foreground">Review efficiently</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg mb-2">
                  <span className="text-primary font-semibold">Admins</span>
                </div>
                <p className="text-muted-foreground">Manage seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
