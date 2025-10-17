import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { MessageDialog } from "@/components/message-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, MessageSquare, Ban, ShieldOff } from "lucide-react";

interface UserProfileDialogProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({
  userId,
  username,
  avatarUrl,
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { toast } = useToast();
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  // Check if following
  const { data: followStatus } = useQuery<{ isFollowing: boolean; followsBack: boolean }>({
    queryKey: [`/api/follow/${userId}/status`],
    enabled: open,
  });

  // Check if blocked
  const { data: blockStatus } = useQuery<{ isBlocked: boolean }>({
    queryKey: [`/api/block/${userId}/status`],
    enabled: open,
  });

  const isFollowing = followStatus?.isFollowing || false;
  const isBlocked = blockStatus?.isBlocked || false;

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/follow/${userId}`);
      } else {
        await apiRequest("POST", `/api/follow/${userId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/follow/${userId}/status`] });
      toast({
        title: isFollowing ? "取消关注成功" : "关注成功",
      });
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    },
  });

  // Block/Unblock mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (isBlocked) {
        await apiRequest("DELETE", `/api/block/${userId}`);
      } else {
        await apiRequest("POST", `/api/block/${userId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/block/${userId}/status`] });
      toast({
        title: isBlocked ? "已解除拉黑" : "已拉黑",
      });
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    },
  });

  const handleMessage = () => {
    // First open the message dialog
    setMessageDialogOpen(true);
    // Then close the profile dialog with a slight delay to ensure smooth transition
    setTimeout(() => {
      onOpenChange(false);
    }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="user-profile-dialog">
          <DialogHeader>
            <DialogTitle>用户资料</DialogTitle>
            <DialogDescription>查看用户信息并进行操作</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <UserAvatar
              avatarUrl={avatarUrl}
              username={username}
              className="w-20 h-20"
              data-testid={`user-avatar-${userId}`}
            />
            
            <div className="text-center">
              <h3 className="text-xl font-semibold" data-testid={`user-name-${userId}`}>
                {username}
              </h3>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleMessage}
                className="w-full"
                data-testid={`button-message-${userId}`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                发送私信
              </Button>

              <Button
                variant="outline"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="w-full"
                data-testid={`button-follow-${userId}`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    取消关注
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    关注
                  </>
                )}
              </Button>

              <Button
                variant={isBlocked ? "outline" : "destructive"}
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                className="w-full"
                data-testid={`button-block-${userId}`}
              >
                {isBlocked ? (
                  <>
                    <ShieldOff className="w-4 h-4 mr-2" />
                    解除拉黑
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    拉黑
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        userId={userId}
        username={username}
        avatarUrl={avatarUrl}
      />
    </>
  );
}
