import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Lock,
  Bell,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImageUrl: string | null;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState<TeamMember | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [newRole, setNewRole] = useState("host");

  const [notifications, setNotifications] = useState({
    newProviderRequests: true,
    newSignups: true,
    systemAlerts: true,
    financialReports: false,
  });

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/admin/users"],
    select: (data: any[]) => data.filter((u: any) => u.role === "admin" || u.role === "provider"),
  });

  const changePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PATCH", "/api/admin/settings/password", data);
      return res.json();
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password changed successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to change password", description: err.message, variant: "destructive" });
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowRoleDialog(null);
      toast({ title: "Role updated" });
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            await apiRequest("PATCH", "/api/admin/settings/profile", { profileImageUrl: base64 });
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Avatar updated" });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) updateAvatar.mutate(file);
  };

  const handlePasswordSubmit = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    changePassword.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold" data-testid="text-settings-title">Settings</h2>

      <Card data-testid="card-profile-settings">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg font-semibold">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <Camera className="h-3 w-3 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} data-testid="input-avatar-upload" />
              </label>
            </div>
            <div>
              <p className="font-medium" data-testid="text-admin-name">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-admin-email">
                {(user as any)?.email}
              </p>
              <Badge variant="secondary" className="mt-1 text-[10px]">Admin</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-security-settings">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowPasswordDialog(true)} data-testid="button-change-password">
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="card-team-settings">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" /> Team & Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3" data-testid={`team-member-${member.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.firstName?.[0] || member.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{member.role}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewRole(member.role);
                      setShowRoleDialog(member);
                    }}
                    data-testid={`button-change-role-${member.id}`}
                  >
                    Change Role
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No team members found</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-notification-settings">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            newProviderRequests: "New provider requests",
            newSignups: "New user signups",
            systemAlerts: "System alerts",
            financialReports: "Financial reports",
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Switch
                checked={notifications[key as keyof typeof notifications]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [key]: checked })}
                data-testid={`switch-notif-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              data-testid="input-current-password"
            />
            <Input
              type="password"
              placeholder="New password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              data-testid="input-new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              data-testid="input-confirm-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={!passwords.currentPassword || !passwords.newPassword || changePassword.isPending}
              data-testid="button-save-password"
            >
              {changePassword.isPending ? "Saving..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRoleDialog} onOpenChange={() => setShowRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {showRoleDialog?.firstName || showRoleDialog?.email}</DialogTitle>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger data-testid="select-new-role"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="host">Host</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(null)}>Cancel</Button>
            <Button
              onClick={() => showRoleDialog && changeRole.mutate({ userId: showRoleDialog.id, role: newRole })}
              disabled={changeRole.isPending}
              data-testid="button-save-role"
            >
              {changeRole.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
