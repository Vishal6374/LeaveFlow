import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, LogOut, User, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, DepartmentAssignment } from "@shared/schema";

type DepartmentAssignmentWithUsers = DepartmentAssignment & {
  classAdvisor?: UserType;
  hod?: UserType;
};

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");

  const { data: users = [], isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<DepartmentAssignmentWithUsers[]>({
    queryKey: ["/api/department-assignments"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleRoleUpdate = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const getStatusBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "hod":
        return <Badge className="bg-purple-100 text-purple-800">HOD</Badge>;
      case "teacher":
        return <Badge className="bg-blue-100 text-blue-800">Teacher</Badge>;
      default:
        return <Badge variant="secondary">Student</Badge>;
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
                  <Settings className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="admin-name">{user?.name}</span>
              <Badge variant="destructive" data-testid="admin-role">Admin</Badge>
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
                    value="users" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    data-testid="tab-users"
                  >
                    User Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="departments" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    data-testid="tab-departments"
                  >
                    Department Mapping
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="users" className="p-6 mt-0">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Roles</h3>
                </div>
                
                {loadingUsers ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-users">
                    No users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((userItem) => (
                          <tr key={userItem.id} data-testid={`row-user-${userItem.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900" data-testid={`user-name-${userItem.id}`}>
                                    {userItem.name}
                                  </div>
                                  <div className="text-sm text-gray-500" data-testid={`user-username-${userItem.id}`}>
                                    {userItem.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Select 
                                value={userItem.role} 
                                onValueChange={(role) => handleRoleUpdate(userItem.id, role)}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-32" data-testid={`select-role-${userItem.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="hod">HOD</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`user-department-${userItem.id}`}>
                              {userItem.department || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(userItem.role)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:text-primary/80"
                                data-testid={`button-edit-${userItem.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="departments" className="p-6 mt-0">
                {loadingAssignments ? (
                  <div className="text-center py-8">Loading department assignments...</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Class Advisor Assignments */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Advisor Assignments</h3>
                      {assignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500" data-testid="text-no-class-assignments">
                          No class assignments found.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4" data-testid={`card-class-${assignment.id}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900" data-testid={`class-title-${assignment.id}`}>
                                    {assignment.year ? `${assignment.year}${assignment.year === 1 ? 'st' : assignment.year === 2 ? 'nd' : assignment.year === 3 ? 'rd' : 'th'}` : ''} Year {assignment.department}
                                  </h4>
                                  <p className="text-sm text-gray-600" data-testid={`class-advisor-${assignment.id}`}>
                                    Class Advisor: {assignment.classAdvisor?.name || "Not assigned"}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`button-edit-class-${assignment.id}`}>
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* HOD Assignments */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">HOD Assignments</h3>
                      {assignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500" data-testid="text-no-hod-assignments">
                          No HOD assignments found.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Group by department */}
                          {Array.from(new Set(assignments.map(a => a.department))).map((dept) => {
                            const deptAssignment = assignments.find(a => a.department === dept);
                            return (
                              <div key={dept} className="border border-gray-200 rounded-lg p-4" data-testid={`card-hod-${dept}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900" data-testid={`dept-title-${dept}`}>
                                      {dept === "AIDS" ? "Artificial Intelligence & Data Science" :
                                       dept === "CSE" ? "Computer Science & Engineering" :
                                       dept === "ECE" ? "Electronics & Communication" :
                                       dept === "EEE" ? "Electrical & Electronics Engineering" :
                                       dept === "MECH" ? "Mechanical Engineering" :
                                       dept === "CIVIL" ? "Civil Engineering" : dept}
                                    </h4>
                                    <p className="text-sm text-gray-600" data-testid={`dept-hod-${dept}`}>
                                      HOD: {deptAssignment?.hod?.name || "Not assigned"}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`button-edit-hod-${dept}`}>
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
