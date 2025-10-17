import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "./user-avatar";
import { Mail, Bell, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Conversation = {
  otherUser: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
  };
  unreadCount: number;
};

type Notification = {
  id: string;
  type: string;
  content: string;
  relatedId?: string;
  isRead: number;
  createdAt: string;
};

export function MessageInbox({ onOpenConversation }: { onOpenConversation?: (userId: string, username: string) => void }) {
  const [open, setOpen] = useState(false);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: open,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("PUT", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const totalUnread = (conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0) + (unreadData?.count || 0);

  const handleConversationClick = (userId: string, username: string) => {
    setOpen(false);
    onOpenConversation?.(userId, username);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.isRead === 0) {
      markAsReadMutation.mutate(notification.id);
    }
    // Handle navigation based on notification type
    if (notification.type === "message" && notification.relatedId) {
      // Open message conversation
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-message-inbox">
          <Mail className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>消息中心</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="messages" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              私信
              {conversations && conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-2" />
              通知
              {unreadData && unreadData.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadData.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {conversations && conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.otherUser.id}
                      className="flex items-start gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                      onClick={() => handleConversationClick(conv.otherUser.id, conv.otherUser.username)}
                      data-testid={`conversation-${conv.otherUser.id}`}
                    >
                      <UserAvatar 
                        avatarUrl={conv.otherUser.avatarUrl}
                        username={conv.otherUser.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{conv.otherUser.username}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无私信</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <div className="flex justify-end mb-2">
              {notifications && notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  data-testid="button-mark-all-read"
                >
                  全部标记为已读
                </Button>
              )}
            </div>
            <ScrollArea className="h-[calc(100vh-250px)]">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-md hover-elevate cursor-pointer ${
                        notification.isRead === 0 ? "bg-accent/50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <Bell className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{notification.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {notification.isRead === 0 && (
                        <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无通知</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
