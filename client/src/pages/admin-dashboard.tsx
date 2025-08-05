import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, LogOut, User, Edit, Plus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User as UserType, DepartmentAssignment } from "@shared/schema";

type DepartmentAssignmentWithUsers = DepartmentAssignment & {
  classAdvisor?: UserType;
  hod?: UserType;
};

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.enum(["CSE", "AIDS", "ECE", "EEE", "MECH", "CIVIL"]).optional(),
  year: z.number().min(1).max(4).optional(),
  email: z.string().email().optional().or(z.literal("")),
  sinNumber: z.string().optional(),
});

const assignmentSchema = z.object({
  department: z.enum(["CSE", "AIDS", "ECE", "EEE", "MECH", "CIVIL"]),
  year: z.number().min(1).max(4),
  classAdvisorId: z.string().optional(),
  hodId: z.string().optional(),
});

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

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

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: z.infer<typeof editUserSchema> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
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

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: z.infer<typeof assignmentSchema>) => {
      const res = await apiRequest("POST", "/api/department-assignments", assignmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/department-assignments"] });
      setAssignmentDialogOpen(false);
      toast({
        title: "Success",
        description: "Department assignment created successfully",
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

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, assignmentData }: { id: string; assignmentData: Partial<z.infer<typeof assignmentSchema>> }) => {
      const res = await apiRequest("PATCH", `/api/department-assignments/${id}`, assignmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/department-assignments"] });
      toast({
        title: "Success",
        description: "Assignment updated successfully",
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

  const handleUserEdit = (userItem: UserType) => {
    setEditingUser(userItem);
  };

  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      department: undefined,
      year: undefined,
      email: "",
      sinNumber: "",
    },
  });

  // Reset form when editing user changes
  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        name: editingUser.name || "",
        department: editingUser.department || undefined,
        year: editingUser.year || undefined,
        email: editingUser.email || "",
        sinNumber: editingUser.sinNumber || "",
      });
    }
  }, [editingUser, editForm]);

  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      department: "CSE",
      year: 1,
      classAdvisorId: "",
      hodId: "",
    },
  });

  const onEditSubmit = (data: z.infer<typeof editUserSchema>) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const onAssignmentSubmit = (data: z.infer<typeof assignmentSchema>) => {
    createAssignmentMutation.mutate(data);
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

  const getTeachers = () => users.filter(u => u.role === 'teacher');
  const getHods = () => users.filter(u => u.role === 'hod');

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
                                onClick={() => handleUserEdit(userItem)}
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
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Class Assignments</h3>
                        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="button-add-assignment">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Department Assignment</DialogTitle>
                              <DialogDescription>
                                Assign teachers and HODs to department classes.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...assignmentForm}>
                              <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-4">
                                <FormField
                                  control={assignmentForm.control}
                                  name="department"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Department</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="CSE">Computer Science</SelectItem>
                                          <SelectItem value="AIDS">AI & Data Science</SelectItem>
                                          <SelectItem value="ECE">Electronics</SelectItem>
                                          <SelectItem value="EEE">Electrical</SelectItem>
                                          <SelectItem value="MECH">Mechanical</SelectItem>
                                          <SelectItem value="CIVIL">Civil</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={assignmentForm.control}
                                  name="year"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Year</FormLabel>
                                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select year" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="1">1st Year</SelectItem>
                                          <SelectItem value="2">2nd Year</SelectItem>
                                          <SelectItem value="3">3rd Year</SelectItem>
                                          <SelectItem value="4">4th Year</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={assignmentForm.control}
                                  name="classAdvisorId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Class Advisor (Teacher)</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select teacher" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getTeachers().map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={assignmentForm.control}
                                  name="hodId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>HOD</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select HOD" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getHods().map((hod) => (
                                            <SelectItem key={hod.id} value={hod.id}>
                                              {hod.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setAssignmentDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={createAssignmentMutation.isPending}
                                  >
                                    {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {assignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500" data-testid="text-no-assignments">
                          No department assignments found. Create one to get started.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4" data-testid={`card-assignment-${assignment.id}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900" data-testid={`assignment-title-${assignment.id}`}>
                                    {assignment.year ? `${assignment.year}${assignment.year === 1 ? 'st' : assignment.year === 2 ? 'nd' : assignment.year === 3 ? 'rd' : 'th'}` : ''} Year {assignment.department}
                                  </h4>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600" data-testid={`class-advisor-${assignment.id}`}>
                                      <UserCheck className="inline h-4 w-4 mr-1" />
                                      Class Advisor: {assignment.classAdvisor?.name || "Not assigned"}
                                    </p>
                                    <p className="text-sm text-gray-600" data-testid={`hod-${assignment.id}`}>
                                      <Settings className="inline h-4 w-4 mr-1" />
                                      HOD: {assignment.hod?.name || "Not assigned"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Select 
                                    value={assignment.classAdvisorId || ""} 
                                    onValueChange={(value) => updateAssignmentMutation.mutate({ 
                                      id: assignment.id, 
                                      assignmentData: { classAdvisorId: value } 
                                    })}
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Assign teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getTeachers().map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                          {teacher.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Statistics */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-600">Total Teachers</p>
                          <p className="text-2xl font-bold text-blue-900">{getTeachers().length}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-600">Total HODs</p>
                          <p className="text-2xl font-bold text-purple-900">{getHods().length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-600">Active Assignments</p>
                          <p className="text-2xl font-bold text-green-900">{assignments.length}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-orange-600">Total Students</p>
                          <p className="text-2xl font-bold text-orange-900">{users.filter(u => u.role === 'student').length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* User Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and department details.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CSE">Computer Science</SelectItem>
                          <SelectItem value="AIDS">AI & Data Science</SelectItem>
                          <SelectItem value="ECE">Electronics</SelectItem>
                          <SelectItem value="EEE">Electrical</SelectItem>
                          <SelectItem value="MECH">Mechanical</SelectItem>
                          <SelectItem value="CIVIL">Civil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="sinNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIN Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter SIN number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
