import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Mail, UserPlus, UserMinus, Star, Trophy, Calendar, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import type { User, UserBadge, Badge as BadgeType } from "@shared/schema";

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

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const isOwnProfile = currentUser?.id === userId;

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

  if (!profile) {
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
      
      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="text-3xl">
                    {profile.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{profile.user.username}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {profile.user.role === "provider" ? "Demand Provider" : "Task Performer"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="font-semibold" data-testid="followers-count">{profile.followersCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Following</span>
                  <span className="font-semibold" data-testid="following-count">{profile.followingCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-semibold">{new Date(profile.user.createdAt).toLocaleDateString()}</span>
                </div>

                {!isOwnProfile && (
                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      variant={profile.isFollowing ? "outline" : "default"}
                      data-testid="button-follow"
                    >
                      {profile.isFollowing ? (
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
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Badges
                </CardTitle>
                <CardDescription>Achievements earned</CardDescription>
              </CardHeader>
              <CardContent>
                {!profile.badges || profile.badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No badges earned yet
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {profile.badges.map((userBadge) => (
                      <div
                        key={userBadge.id}
                        className="flex flex-col items-center p-3 rounded-lg bg-muted"
                        data-testid={`badge-${userBadge.badgeId}`}
                      >
                        <span className="text-2xl mb-1">{userBadge.badge.icon}</span>
                        <span className="text-xs font-medium text-center">{userBadge.badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="stat-completed-tasks">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.stats.completedTasks}</div>
                </CardContent>
              </Card>

              <Card data-testid="stat-earnings">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${profile.stats.totalEarnings}</div>
                </CardContent>
              </Card>

              <Card data-testid="stat-rating">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {profile.stats.averageRating > 0 ? profile.stats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.stats.totalReviews} reviews
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="stat-badges">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.badges.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest contributions and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Activity feed coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
