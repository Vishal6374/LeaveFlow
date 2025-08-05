import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Presentation, Check, X, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRequest, User, ActivityLog } from "@shared/schema";

type LeaveRequestWithStudent = LeaveRequest & { student: User };
type ActivityLogWithDetails = ActivityLog & { 
  leaveRequest: LeaveRequest & { student: User }; 
  actionBy: User 
};

export default function StaffDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: pendingRequests = [], isLoading: loadingPending } = useQuery<LeaveRequestWithStudent[]>({
    queryKey: ["/api/leave-requests/pending"],
  });

  const { data: recentRequests = [], isLoading: loadingRecent } = useQuery<LeaveRequestWithStudent[]>({
    queryKey: ["/api/leave-requests/recent"],
  });

  const { data: activityLogs = [], isLoading: loadingActivity } = useQuery<ActivityLogWithDetails[]>({
    queryKey: ["/api/activity-logs"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const res = await apiRequest("PATCH", `/api/leave-requests/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Success",
        description: "Request status updated successfully",
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

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case "sick":
        return "🤒";
      case "emergency":
        return "🚨";
      case "medical":
        return "🏥";
      default:
        return "📋";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
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
                  <Presentation className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Staff Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="staff-name">{user?.name}</span>
              <Badge className="bg-success/10 text-success-800" data-testid="staff-role">
                {user?.role === "hod" ? "HOD" : "Teacher"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="shadow-lg overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
                  <TabsTrigger 
                    value="pending" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    data-testid="tab-pending"
                  >
                    Pending Requests
                    {pendingRequests.length > 0 && (
                      <Badge className="ml-2 bg-primary/10 text-primary" data-testid="pending-count">
                        {pendingRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logs" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    data-testid="tab-logs"
                  >
                    Recent Activity
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    data-testid="tab-activity"
                  >
                    Activity Logs
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pending" className="p-6 mt-0">
                {loadingPending ? (
                  <div className="text-center py-8">Loading pending requests...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-pending">
                    No pending requests to review.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-gray-50"
                        data-testid={`card-pending-${request.id}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900" data-testid={`student-name-${request.id}`}>
                                {request.student.name}
                              </h4>
                              <span className="text-sm text-gray-500" data-testid={`student-details-${request.id}`}>
                                {request.student.year ? `${request.student.year}${request.student.year === 1 ? 'st' : request.student.year === 2 ? 'nd' : request.student.year === 3 ? 'rd' : 'th'} Year` : ''} {request.student.department} - SIN: {request.student.sinNumber}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mb-3">
                              <Badge className="bg-blue-100 text-blue-800" data-testid={`leave-type-${request.id}`}>
                                {getLeaveTypeIcon(request.type)} {request.type} Leave
                              </Badge>
                              <span className="text-sm text-gray-600" data-testid={`leave-duration-${request.id}`}>
                                {format(new Date(request.fromDate), 'MMM dd')} - {format(new Date(request.toDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3" data-testid={`leave-reason-${request.id}`}>
                              {request.reason}
                            </p>
                            <p className="text-xs text-gray-500" data-testid={`submitted-time-${request.id}`}>
                              Submitted: {format(new Date(request.submittedAt), 'MMM dd, yyyy \'at\' h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-gray-200">
                          <Button 
                            className="flex-1 bg-success hover:bg-success/90" 
                            onClick={() => handleApprove(request.id)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1" 
                            onClick={() => handleReject(request.id)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs" className="p-6 mt-0">
                {loadingRecent ? (
                  <div className="text-center py-8">Loading activity logs...</div>
                ) : recentRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-logs">
                    No recent activity found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <div 
                        key={request.id}
                        className={`border-l-4 p-4 rounded-r-lg ${
                          request.status === "approved" 
                            ? "border-success bg-success/5" 
                            : "border-destructive bg-destructive/5"
                        }`}
                        data-testid={`log-${request.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              request.status === "approved" ? "text-success" : "text-destructive"
                            }`} data-testid={`log-action-${request.id}`}>
                              {request.status === "approved" ? "✓" : "✗"} {request.status === "approved" ? "Approved" : "Rejected"} leave request for {request.student.name}
                            </p>
                            <p className={`text-xs mt-1 ${
                              request.status === "approved" ? "text-success/80" : "text-destructive/80"
                            }`} data-testid={`log-details-${request.id}`}>
                              {request.student.year ? `${request.student.year}${request.student.year === 1 ? 'st' : request.student.year === 2 ? 'nd' : request.student.year === 3 ? 'rd' : 'th'} Year` : ''} {request.student.department} - {request.type} Leave ({format(new Date(request.fromDate), 'MMM dd')} - {format(new Date(request.toDate), 'MMM dd, yyyy')})
                            </p>
                          </div>
                          <span className={`text-xs ${
                            request.status === "approved" ? "text-success/80" : "text-destructive/80"
                          }`} data-testid={`log-timestamp-${request.id}`}>
                            {request.reviewedAt ? format(new Date(request.reviewedAt), 'MMM dd, h:mm a') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="p-6 mt-0">
                {loadingActivity ? (
                  <div className="text-center py-8">Loading activity logs...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-activity">
                    No shared activity logs found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Shared activity between HOD and class advisors for department requests
                    </div>
                    {activityLogs.map((log) => (
                      <div 
                        key={log.id}
                        className={`border-l-4 p-4 rounded-r-lg ${
                          log.action === "approved" 
                            ? "border-success bg-success/5" 
                            : log.action === "rejected"
                            ? "border-destructive bg-destructive/5"
                            : "border-blue-500 bg-blue-50"
                        }`}
                        data-testid={`activity-${log.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              log.action === "approved" ? "text-success" : 
                              log.action === "rejected" ? "text-destructive" : "text-blue-700"
                            }`} data-testid={`activity-action-${log.id}`}>
                              {log.action === "approved" ? "✓" : log.action === "rejected" ? "✗" : "📋"} 
                              {" "}{log.actionBy.name} {log.action} leave request for {log.leaveRequest.student.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1" data-testid={`activity-details-${log.id}`}>
                              {log.year ? `${log.year}${log.year === 1 ? 'st' : log.year === 2 ? 'nd' : log.year === 3 ? 'rd' : 'th'} Year` : ''} {log.department} - {log.leaveRequest.type} Leave
                            </p>
                            <p className="text-xs text-gray-500 mt-1" data-testid={`activity-reason-${log.id}`}>
                              {log.leaveRequest.reason}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Duration: {format(new Date(log.leaveRequest.fromDate), 'MMM dd')} - {format(new Date(log.leaveRequest.toDate), 'MMM dd, yyyy')}</span>
                              <span>Reviewer: {log.actionBy.role === 'hod' ? 'HOD' : 'Class Advisor'}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500" data-testid={`activity-timestamp-${log.id}`}>
                            {format(new Date(log.actionAt), 'MMM dd, h:mm a')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
