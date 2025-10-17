import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./user-avatar";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: number;
  createdAt: string;
  sender: {
    id: string;
    username: string;
  };
  receiver: {
    id: string;
    username: string;
  };
};

type MessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
};

export function MessageDialog({ open, onOpenChange, userId, username }: MessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversation
  const { data: conversation = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/messages/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: open && !!userId,
    refetchInterval: 5000, // Refresh every 5 seconds when dialog is open
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", "/api/messages", {
        receiverId: userId,
        content,
      }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "消息已发送",
      });
    },
    onError: (error: any) => {
      toast({
        title: "发送失败",
        description: error.message || "无法发送消息",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <UserAvatar 
              avatarUrl={null}
              username={username}
              size="md"
            />
            <span>{username}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {conversation.length > 0 ? (
              conversation.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <span
                        className={`text-xs mt-1 block ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无消息，发送第一条消息开始对话</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息... (Shift+Enter 换行)"
              className="min-h-[60px] resize-none"
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
              className="shrink-0 self-end"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
