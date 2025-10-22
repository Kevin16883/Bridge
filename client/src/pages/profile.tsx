import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  MapPin, 
  Globe, 
  Briefcase, 
  Mail, 
  Edit, 
  Save, 
  X,
  Star,
  CheckCircle2,
  Clock,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  username: string;
  role: "provider" | "performer";
  email: string | null;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  website: string | null;
  skills: string[] | null;
  rating: number;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  difficulty: string;
  status: string;
}

interface Project {
  id: string;
  originalDemand: string;
  status: string;
  totalBudget: string;
  createdAt: string;
}

export default function Profile() {
  const [, params] = useRoute("/users/:id");
  const userId = params?.id;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    avatar: "",
    bio: "",
    company: "",
    location: "",
    website: "",
    skills: [] as string[],
  });

  const { data: currentUser } = useQuery<UserProfile>({
    queryKey: ["/api/user"],
  });

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: user?.role === "provider" && currentUser?.id === userId,
  });

  const { data: performerStats } = useQuery<any>({
    queryKey: ["/api/performer/stats"],
    enabled: user?.role === "performer" && currentUser?.id === userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/user/profile", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const isOwnProfile = currentUser?.id === userId;

  const handleEdit = () => {
    if (user) {
      setFormData({
        avatar: user.avatar || "",
        bio: user.bio || "",
        company: user.company || "",
        location: user.location || "",
        website: user.website || "",
        skills: user.skills || [],
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">User not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 max-w-5xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20" data-testid="img-avatar">
                  {isEditing ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-username">{user.username}</h1>
                  <Badge variant={user.role === "provider" ? "default" : "secondary"} data-testid="badge-role">
                    {user.role === "provider" ? "Provider" : "Performer"}
                  </Badge>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-muted-foreground" data-testid="text-rating">
                      {user.rating}/5
                    </span>
                  </div>
                </div>
              </div>
              {isOwnProfile && !isEditing && (
                <Button onClick={handleEdit} variant="outline" data-testid="button-edit-profile">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" data-testid="button-cancel-edit">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Avatar URL</label>
                  <Input
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    data-testid="input-avatar"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    data-testid="input-bio"
                  />
                </div>
                {user.role === "provider" && (
                  <div>
                    <label className="text-sm font-medium">Company</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company name"
                      data-testid="input-company"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    type="url"
                    data-testid="input-website"
                  />
                </div>
                {user.role === "performer" && (
                  <div>
                    <label className="text-sm font-medium">Skills (comma-separated)</label>
                    <Input
                      value={formData.skills.join(", ")}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="JavaScript, React, Node.js"
                      data-testid="input-skills"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {user.bio && (
                  <p className="text-muted-foreground" data-testid="text-bio">{user.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {user.company && (
                    <div className="flex items-center gap-2" data-testid="text-company">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{user.company}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2" data-testid="text-location">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid="link-website"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-2" data-testid="text-email">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
                {user.skills && user.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge key={skill} variant="outline" data-testid={`badge-skill-${skill}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isOwnProfile && (
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
              <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-4">
              {user.role === "performer" && performerStats && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-completed-tasks">
                        {performerStats.completedTasks}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-earnings">
                        ${performerStats.totalEarnings}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-badges">
                        {performerStats.totalBadges}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {user.role === "provider" && projects && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Published Projects</h3>
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} data-testid={`card-project-${project.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{project.originalDemand}</CardTitle>
                              <CardDescription>
                                Created {new Date(project.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Budget: {project.totalBudget}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Messages feature coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Notifications feature coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
