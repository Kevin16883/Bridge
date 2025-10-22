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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Award,
  Bookmark,
  Eye,
  MessageSquare
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

interface SavedQuestion {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  viewCount: number;
  createdAt: string;
  authorUsername: string;
}

interface FollowingUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: string;
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
  
  const { data: savedQuestions = [] } = useQuery<SavedQuestion[]>({
    queryKey: ["/api/saved-questions"],
    enabled: !!currentUser && currentUser.id === userId,
  });
  
  const { data: following = [] } = useQuery<FollowingUser[]>({
    queryKey: ["/api/following"],
    enabled: !!currentUser && currentUser.id === userId,
  });
  
  const togglePrivacyMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      return await apiRequest("PATCH", "/api/user/privacy", { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Success",
        description: "Privacy settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update privacy settings",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("PATCH", "/api/user/profile", data);
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
              <TabsTrigger value="saved" data-testid="tab-saved">Saved</TabsTrigger>
              <TabsTrigger value="following" data-testid="tab-following">Following</TabsTrigger>
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
              
              {user.role === "performer" && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can view your profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="profile-public">Public Profile</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to view your profile and completed tasks
                        </p>
                      </div>
                      <Switch
                        id="profile-public"
                        checked={user.isProfilePublic === 1}
                        onCheckedChange={(checked) => togglePrivacyMutation.mutate(checked)}
                        disabled={togglePrivacyMutation.isPending}
                        data-testid="switch-profile-public"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5" />
                    Saved Questions ({savedQuestions.length})
                  </CardTitle>
                  <CardDescription>Questions you've bookmarked for later</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedQuestions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No saved questions yet. Start exploring the Q&A Community!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {savedQuestions.map((question) => (
                        <a
                          key={question.id}
                          href={`/community/questions/${question.id}`}
                          className="block"
                          data-testid={`saved-question-${question.id}`}
                        >
                          <Card className="hover-elevate">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-lg mb-1">{question.title}</CardTitle>
                                  <CardDescription className="line-clamp-2">
                                    {question.content}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline">{question.category}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{question.viewCount} views</span>
                                </div>
                                <span>•</span>
                                <span>Asked by {question.authorUsername}</span>
                                <span>•</span>
                                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {question.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="following" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Following ({following.length})
                  </CardTitle>
                  <CardDescription>Users you're following</CardDescription>
                </CardHeader>
                <CardContent>
                  {following.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      You're not following anyone yet. Visit user profiles to follow them!
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {following.map((user) => (
                        <a
                          key={user.id}
                          href={`/users/${user.id}`}
                          className="block"
                          data-testid={`following-user-${user.id}`}
                        >
                          <Card className="hover-elevate">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-4">
                                <Avatar>
                                  <AvatarFallback>
                                    {user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <CardTitle className="text-base">{user.username}</CardTitle>
                                  <CardDescription>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {user.role === "provider" ? "Provider" : "Performer"}
                                    </Badge>
                                  </CardDescription>
                                  {user.bio && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {user.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
