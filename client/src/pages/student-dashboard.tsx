import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeaveRequestSchema, type InsertLeaveRequest, type LeaveRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarPlus, Eye, User, LogOut, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStatusView, setShowStatusView] = useState(false);

  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/my"],
  });

  const form = useForm<InsertLeaveRequest>({
    resolver: zodResolver(insertLeaveRequestSchema.omit({ studentId: true })),
    defaultValues: {
      type: undefined,
      fromDate: undefined,
      toDate: undefined,
      reason: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: Omit<InsertLeaveRequest, "studentId">) => {
      const res = await apiRequest("POST", "/api/leave-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/my"] });
      setShowRequestModal(false);
      form.reset();
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitRequest = (data: Omit<InsertLeaveRequest, "studentId">) => {
    createRequestMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground" data-testid={`status-approved`}>Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`status-rejected`}>Rejected</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`status-pending`}>Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Student Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="user-name">{user?.name}</span>
              <Badge className="bg-primary/10 text-primary" data-testid="user-role">Student</Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!showStatusView ? (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Request Leave Card */}
                <Card className="hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CalendarPlus className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
                        <p className="text-sm text-gray-500">Submit a new leave request</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                        <DialogTrigger asChild>
                          <Button className="w-full" data-testid="button-new-request">
                            New Request
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Leave</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4" data-testid="form-leave-request">
                              <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Leave Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-leave-type">
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="sick">Sick Leave</SelectItem>
                                        <SelectItem value="personal">Personal Leave</SelectItem>
                                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                                        <SelectItem value="medical">Medical Leave</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="fromDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>From Date</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="date" 
                                          {...field} 
                                          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                          onChange={(e) => field.onChange(new Date(e.target.value))}
                                          data-testid="input-from-date"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="toDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>To Date</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="date" 
                                          {...field} 
                                          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                          onChange={(e) => field.onChange(new Date(e.target.value))}
                                          data-testid="input-to-date"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Please provide reason for leave..." 
                                        {...field} 
                                        data-testid="textarea-reason"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex space-x-3">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="flex-1" 
                                  onClick={() => setShowRequestModal(false)}
                                  data-testid="button-cancel-request"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="flex-1" 
                                  disabled={createRequestMutation.isPending}
                                  data-testid="button-submit-request"
                                >
                                  {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* View Status Card */}
                <Card className="hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-warning-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">View Status</h3>
                        <p className="text-sm text-gray-500">Check your leave requests</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button 
                        className="w-full bg-warning-600 hover:bg-warning-700" 
                        onClick={() => setShowStatusView(true)}
                        data-testid="button-view-status"
                      >
                        View Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Card */}
                <Card className="hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                          <User className="h-6 w-6 text-success-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                        <p className="text-sm text-gray-500">View your information</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Name:</span>
                          <span className="font-medium" data-testid="profile-name">{user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Department:</span>
                          <span className="font-medium" data-testid="profile-department">{user?.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Year:</span>
                          <span className="font-medium" data-testid="profile-year">{user?.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">SIN:</span>
                          <span className="font-medium" data-testid="profile-sin">{user?.sinNumber}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* Leave Status View */
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
                <Button variant="outline" onClick={() => setShowStatusView(false)} data-testid="button-back-to-dashboard">
                  Back to Dashboard
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : leaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" data-testid="text-no-requests">
                      No leave requests found. Submit your first request!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaveRequests.map((request) => (
                        <div 
                          key={request.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`card-request-${request.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize" data-testid={`request-type-${request.id}`}>
                                  {request.type} Leave
                                </span>
                                {getStatusBadge(request.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2" data-testid={`request-dates-${request.id}`}>
                                {format(new Date(request.fromDate), 'MMM dd, yyyy')} - {format(new Date(request.toDate), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm text-gray-700" data-testid={`request-reason-${request.id}`}>{request.reason}</p>
                            </div>
                            <div className="text-xs text-right text-gray-500">
                              <p data-testid={`request-submitted-${request.id}`}>
                                Submitted: {request.submittedAt ? format(new Date(request.submittedAt), 'MMM dd, yyyy') : 'Unknown'}
                              </p>
                              {request.reviewedAt && (
                                <p data-testid={`request-reviewed-${request.id}`}>
                                  Reviewed: {format(new Date(request.reviewedAt), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
