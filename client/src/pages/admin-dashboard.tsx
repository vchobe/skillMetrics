import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { User, Skill, SkillHistory, ProfileHistory, SKILL_LEVELS } from "@shared/schema";
import { Search, Users, Award, RefreshCw, Database, Eye, History, Mail, Edit, Trash, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [showSkillDetailModal, setShowSkillDetailModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showSkillHistoryModal, setShowSkillHistoryModal] = useState(false);
  const { toast } = useToast();

  // Fetch all users
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all skills
  const { data: allSkills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/all-skills"],
  });

  // Filtered users based on search query
  const filteredUsers = allUsers?.filter((u) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (filterField === "all") {
      return (
        u.email.toLowerCase().includes(query) ||
        (u.firstName?.toLowerCase() || "").includes(query) ||
        (u.lastName?.toLowerCase() || "").includes(query) ||
        (u.role?.toLowerCase() || "").includes(query) ||
        (u.projectName?.toLowerCase() || "").includes(query) ||
        (u.clientName?.toLowerCase() || "").includes(query) ||
        (u.location?.toLowerCase() || "").includes(query)
      );
    }
    
    // Search by specific field
    return (u[filterField as keyof User] as string || "")
      .toLowerCase()
      .includes(query);
  });

  // Prepare data for charts
  const skillLevelData = !allSkills ? [] : SKILL_LEVELS.map(level => {
    const count = allSkills.filter(skill => skill.level === level).length;
    return { name: level, count };
  });

  const projectData = !allUsers ? [] : allUsers.reduce((acc: { name: string; count: number }[], user) => {
    if (!user.projectName) return acc;
    
    const existingProject = acc.find(p => p.name === user.projectName);
    if (existingProject) {
      existingProject.count += 1;
    } else {
      acc.push({ name: user.projectName, count: 1 });
    }
    
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (!user) return null;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    className="pl-10"
                    placeholder="Search users and skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="firstName">First Name</SelectItem>
                    <SelectItem value="lastName">Last Name</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="projectName">Project</SelectItem>
                    <SelectItem value="clientName">Client</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterField("all");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users ({allUsers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Skills ({allSkills?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project / Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers?.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.role || "—"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.projectName || "—"}</div>
                            <div className="text-sm text-gray-500">{user.clientName || "—"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.location || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetailModal(true);
                                }}
                                className="h-8 px-2 text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserHistoryModal(true);
                                }}
                                className="h-8 px-2 text-purple-600"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Implement email sending feature
                                  toast({
                                    title: "Email sent",
                                    description: `Notification email sent to ${user.email}`,
                                  });
                                }}
                                className="h-8 px-2 text-green-600"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="skills">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skill
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingSkills ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          Loading skills...
                        </td>
                      </tr>
                    ) : allSkills?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No skills found
                        </td>
                      </tr>
                    ) : (
                      allSkills
                        ?.filter(
                          (skill) =>
                            !searchQuery ||
                            skill.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((skill) => {
                          const skillUser = allUsers?.find(
                            (u) => u.id === skill.userId
                          );
                          return (
                            <tr key={skill.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {skill.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {skillUser
                                    ? `${skillUser.firstName || ""} ${
                                        skillUser.lastName || ""
                                      }`
                                    : "Unknown User"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {skillUser?.email || ""}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={
                                    skill.level === "Beginner"
                                      ? "bg-blue-100 text-blue-800"
                                      : skill.level === "Intermediate"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-purple-100 text-purple-800"
                                  }
                                >
                                  {skill.level}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {skill.certificationUrl ? (
                                  <a
                                    href={skill.certificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-primary-600 hover:text-primary-900"
                                  >
                                    <Award className="h-4 w-4 mr-1" /> View
                                  </a>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(skill.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSkill(skill);
                                      setShowSkillDetailModal(true);
                                    }}
                                    className="h-8 px-2 text-blue-600"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSkill(skill);
                                      setShowSkillHistoryModal(true);
                                    }}
                                    className="h-8 px-2 text-purple-600"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Handle skill editing
                                      toast({
                                        title: "Edit mode",
                                        description: `Editing ${skill.name}`,
                                      });
                                    }}
                                    className="h-8 px-2 text-orange-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Level Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillLevelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Number of Skills" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {projectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* User Detail Modal */}
        <Dialog open={showUserDetailModal} onOpenChange={setShowUserDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Users className="h-5 w-5 mr-2" /> User Details
              </DialogTitle>
              <DialogDescription>
                Comprehensive information about {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div>{selectedUser.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Full Name</div>
                      <div>{selectedUser.firstName} {selectedUser.lastName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Role</div>
                      <div>{selectedUser.role || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Project</div>
                      <div>{selectedUser.projectName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Client</div>
                      <div>{selectedUser.clientName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <div>{selectedUser.location || "—"}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allSkills?.filter(skill => skill.userId === selectedUser.id).length === 0 ? (
                      <p className="text-sm text-gray-500">No skills recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {allSkills
                          ?.filter(skill => skill.userId === selectedUser.id)
                          .map(skill => (
                            <div key={skill.id} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{skill.name}</div>
                                <div className="text-sm text-gray-500">
                                  Last updated: {new Date(skill.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  skill.level === "Beginner"
                                    ? "bg-blue-100 text-blue-800"
                                    : skill.level === "Intermediate"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }
                              >
                                {skill.level}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowUserDetailModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* User History Modal */}
        <Dialog open={showUserHistoryModal} onOpenChange={setShowUserHistoryModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <History className="h-5 w-5 mr-2" /> Edit History
              </DialogTitle>
              <DialogDescription>
                Profile update history for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* We'll implement this with API call later */}
                    <div className="text-sm text-muted-foreground">
                      <p>Showing the last 10 updates for this user</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">Role Changed</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Previous: </span> 
                          <span className="line-through">Junior Developer</span>
                          <span className="text-muted-foreground ml-2">New: </span>
                          <span>Senior Developer</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">Project Assignment</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Previous: </span> 
                          <span className="line-through">Data Migration</span>
                          <span className="text-muted-foreground ml-2">New: </span>
                          <span>Cloud Infrastructure</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowUserHistoryModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Skill Detail Modal */}
        <Dialog open={showSkillDetailModal} onOpenChange={setShowSkillDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Award className="h-5 w-5 mr-2" /> Skill Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about {selectedSkill?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSkill && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedSkill.name}</CardTitle>
                    <CardDescription>
                      Last updated on {new Date(selectedSkill.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Skill Level</div>
                      <Badge
                        variant="outline"
                        className={
                          selectedSkill.level === "Beginner"
                            ? "bg-blue-100 text-blue-800"
                            : selectedSkill.level === "Intermediate"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }
                      >
                        {selectedSkill.level}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">User</div>
                      <div>
                        {allUsers?.find(u => u.id === selectedSkill.userId)?.firstName || ""}{" "}
                        {allUsers?.find(u => u.id === selectedSkill.userId)?.lastName || ""}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allUsers?.find(u => u.id === selectedSkill.userId)?.email || ""}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Certification</div>
                      {selectedSkill.certificationUrl ? (
                        <a
                          href={selectedSkill.certificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-900"
                        >
                          <Award className="h-4 w-4 mr-1" /> View Certification
                        </a>
                      ) : (
                        <span className="text-gray-500">No certification</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowSkillDetailModal(false);
                  if (selectedSkill) {
                    setSelectedSkill(selectedSkill);
                    setShowSkillHistoryModal(true);
                  }
                }}
              >
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSkillDetailModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Skill History Modal */}
        <Dialog open={showSkillHistoryModal} onOpenChange={setShowSkillHistoryModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <History className="h-5 w-5 mr-2" /> Skill History
              </DialogTitle>
              <DialogDescription>
                Update history for {selectedSkill?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSkill && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Level Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* We'll implement this with API call later */}
                    <div className="text-sm text-muted-foreground">
                      <p>Showing all skill level changes</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">Level Upgraded</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Previous: </span> 
                          <span className="line-through">Beginner</span>
                          <span className="text-muted-foreground ml-2">New: </span>
                          <span>Intermediate</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">Certification Added</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Certification URL: </span> 
                          <a href="#" className="text-blue-600 hover:underline">
                            https://credentials.example.com/verify/abc123
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSkillHistoryModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}