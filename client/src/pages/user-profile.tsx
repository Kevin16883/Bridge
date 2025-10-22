import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, UserPlus, UserMinus, Star, Trophy, Calendar, MessageSquare, Lock } from "lucide-react";
import { Link } from "wouter";
import type { User, UserBadge, Badge as BadgeType, Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ProfileData {
  user: User;
  stats: {
    completedTasks: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
  };
  badges: (UserBadge & { badge: BadgeType })[];
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export default function UserProfile() {
  const [, params] = useRoute("/users/:userId");
  const userId = params?.userId;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  const { data: userData, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  const { data: isFollowing, isLoading: isFollowingLoading } = useQuery<{ isFollowing: boolean }>({
    queryKey: [`/api/users/${userId}/is-following`],
    enabled: !!userId && !!currentUser && currentUser.id !== userId,
  });
  
  const { data: stats } = useQuery<{ followersCount: number; followingCount: number }>({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: !!userId,
  });
  
  const { data: ratingData } = useQuery<{ averageRating: number; ratingCount: number }>({
    queryKey: [`/api/users/${userId}/rating`],
    enabled: !!userId,
  });
  
  const isOwnProfile = currentUser?.id === userId;
  const isProfilePrivate = userData && userData.role === "performer" && userData.isProfilePublic === 0 && !isOwnProfile;
  
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId && !isProfilePrivate,
  });
  const isLoading = isUserLoading || isFollowingLoading;
  
  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/${userId}/follow`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/is-following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      toast({
        title: "Success",
        description: "Successfully followed user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    },
  });
  
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/users/${userId}/follow`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/is-following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      toast({
        title: "Success",
        description: "Successfully unfollowed user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });
  
  const rateMutation = useMutation({
    mutationFn: async ({ rating, taskId, comment }: { rating: number; taskId: string; comment?: string }) => {
      return await apiRequest("POST", `/api/users/${userId}/rate`, { rating, taskId, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/rating`] });
      setIsRatingDialogOpen(false);
      setSelectedRating(0);
      setRatingComment("");
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });
  
  const handleFollow = () => {
    if (isFollowing?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
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
  
  // Check if profile is private
  if (userData.isProfilePublic === 0 && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">This profile is private</p>
                <p className="text-sm text-muted-foreground">Only the owner can view this profile</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="text-3xl">
                    {userData.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{userData.username}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {userData.role === "provider" ? "Provider" : "Performer"}
                  </Badge>
                </CardDescription>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{ratingData?.averageRating?.toFixed(1) || 0}/5</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="font-semibold" data-testid="followers-count">{stats?.followersCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Following</span>
                  <span className="font-semibold" data-testid="following-count">{stats?.followingCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-semibold">{new Date(userData.createdAt).toLocaleDateString()}</span>
                </div>

                {!isOwnProfile && currentUser && (
                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      variant={isFollowing?.isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      data-testid="button-follow"
                    >
                      {isFollowing?.isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Link href={`/messages?user=${userId}`}>
                      <Button className="w-full" variant="outline" data-testid="button-message">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Rating</CardTitle>
                <CardDescription>User rating & reviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{ratingData?.averageRating?.toFixed(1) || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Reviews</span>
                  <span className="font-semibold">{ratingData?.ratingCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {userData.role === "performer" ? "Tasks Completed" : "Tasks Published"}
                </CardTitle>
                <CardDescription>
                  {userData.role === "performer" 
                    ? "Tasks this performer has completed" 
                    : "Tasks published by this provider"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTasksLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Loading tasks...
                  </p>
                ) : !tasks || tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <Card key={task.id} className="hover-elevate" data-testid={`task-${task.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-base">{task.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {task.description.substring(0, 100)}
                                {task.description.length > 100 && "..."}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {task.difficulty}
                            </span>
                            <span>•</span>
                            <span>{task.budget}</span>
                            <span>•</span>
                            <span>{task.estimatedTime}</span>
                          </div>
                          {task.skills && task.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {task.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{task.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
