import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Send, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Message, User } from "@shared/schema";

interface MessageWithUsers extends Message {
  senderUsername: string;
  receiverUsername: string;
}

interface Conversation {
  userId: string;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  
  // Get user ID from URL query parameter
  useEffect(() => {
    // Use window.location.search for more reliable query string parsing
    const searchParams = new URLSearchParams(window.location.search);
    const userParam = searchParams.get('user');
    console.log('Messages page - URL search:', window.location.search);
    console.log('Messages page - user param:', userParam);
    if (userParam) {
      setSelectedUserId(userParam);
    }
  }, [location]);

  const { data: conversations, status: conversationsStatus } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: messages, isLoading } = useQuery<MessageWithUsers[]>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!selectedUserId,
  });
  
  // Fetch selected user info if not in conversations (for new conversations)
  // Only fetch after conversations have loaded and user is not in the list
  const { data: selectedUserInfo } = useQuery<User>({
    queryKey: ["/api/users", selectedUserId],
    enabled: 
      !!selectedUserId && 
      conversationsStatus === 'success' && 
      !conversations?.find(c => c.userId === selectedUserId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: (_, variables) => {
      // Invalidate all messages queries including the specific conversation
      queryClient.invalidateQueries({ queryKey: ["/api/messages"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");
      toast({
        title: "Message sent!",
        description: "Your message has been delivered.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mark messages as read when selecting a conversation (only when there are unread messages)
  useEffect(() => {
    if (selectedUserId && conversations) {
      const selectedConv = conversations.find(c => c.userId === selectedUserId);
      if (selectedConv && selectedConv.unreadCount > 0) {
        // Only mark as read if there are unread messages
        apiRequest("POST", `/api/messages/${selectedUserId}/read`, {})
          .then(() => {
            // Invalidate conversations to update unread counts
            queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
          })
          .catch(() => {
            // Silently fail - this is not critical
          });
      }
    }
  }, [selectedUserId, conversations]);

  const handleSendMessage = () => {
    if (!selectedUserId || !messageText.trim()) return;
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText.trim(),
    });
  };

  const selectedConversation = conversations?.find(c => c.userId === selectedUserId);
  
  // Get display name for selected user
  const selectedUserDisplayName = selectedConversation?.username || selectedUserInfo?.username || "User";

  // Debug logging
  console.log('Messages render - selectedUserId:', selectedUserId);
  console.log('Messages render - selectedUserDisplayName:', selectedUserDisplayName);
  console.log('Messages render - conversations:', conversations);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        {selectedUserId && (
          <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <p className="text-sm">Debug: Selected User ID = {selectedUserId}</p>
            <p className="text-sm">Display Name = {selectedUserDisplayName}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Your recent conversations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)]">
                {!conversations || conversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.userId}
                        onClick={() => setSelectedUserId(conversation.userId)}
                        className={`w-full p-4 text-left hover-elevate transition-colors ${
                          selectedUserId === conversation.userId ? 'bg-accent' : ''
                        }`}
                        data-testid={`conversation-${conversation.userId}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {conversation.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">{conversation.username}</p>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conversation.lastMessageTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 h-[calc(100vh-200px)]">
            {selectedUserId ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedUserDisplayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedUserDisplayName}</CardTitle>
                      <CardDescription>Send and receive messages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
                  <ScrollArea className="flex-1 p-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading messages...</p>
                      </div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No messages yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            data-testid={`message-${message.id}`}
                          >
                            <div className={`max-w-[70%] ${
                              message.senderId === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            } rounded-lg p-3`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user?.id
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}>
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="resize-none"
                        rows={2}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        size="icon"
                        data-testid="button-send"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                  <p className="text-sm mt-2">Or click "Send Message" on a user's profile to start a new conversation</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
