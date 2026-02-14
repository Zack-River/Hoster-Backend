import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, UserPlus, MoreVertical, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  listingCount: number;
  reservationCount: number;
  connectedChannels: number;
  blocked: boolean;
  createdAt: string;
  subscriptionPlan: string;
}

const roles = ["All", "Host", "Provider"];

function getUserDisplayName(user: AdminUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

function getUserInitials(user: AdminUser): string {
  if (user.firstName || user.lastName) {
    return [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  }
  return user.email[0].toUpperCase();
}

function getPlanBadgeVariant(plan: string) {
  switch (plan) {
    case "growth": return "default" as const;
    case "expanding": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "", lastName: "", email: "", password: "",
    role: "host", phone: "", country: "", companyName: "", subscriptionPlan: "light",
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (roleFilter !== "All") queryParams.set("role", roleFilter.toLowerCase());
  const queryString = queryParams.toString();

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users${queryString ? `?${queryString}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowAddUser(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", role: "host", phone: "", country: "", companyName: "", subscriptionPlan: "light" });
      toast({ title: "User created successfully" });
    },
    onError: (error: any) => {
      const msg = error?.message || "An unknown error occurred";
      toast({ title: "Failed to create user", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold" data-testid="text-users-title">Users</h2>
        <Button onClick={() => setShowAddUser(true)} data-testid="button-add-user">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {roles.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter(role)}
              data-testid={`button-filter-${role.toLowerCase()}`}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))
        ) : users && users.length > 0 ? (
          users.map((user) => {
            const displayName = getUserDisplayName(user);
            const initials = getUserInitials(user);

            return (
              <Card key={user.id} data-testid={`card-user-${user.id}`}>
                <div className="flex items-center gap-3 p-4" data-testid={`row-user-${user.id}`}>
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate" data-testid={`text-user-name-${user.id}`}>
                        {displayName}
                      </p>
                      <Badge variant="secondary" data-testid={`badge-role-${user.id}`}>
                        {user.role}
                      </Badge>
                      <Badge variant={getPlanBadgeVariant(user.subscriptionPlan)} data-testid={`badge-plan-${user.id}`}>
                        {user.subscriptionPlan}
                      </Badge>
                      {user.blocked && (
                        <Badge variant="destructive" data-testid={`badge-blocked-${user.id}`}>
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {user.listingCount} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.reservationCount} bookings
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-user-menu-${user.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/users/${user.id}`)}
                          data-testid={`button-more-info-${user.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          More Information
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-users">
            No users found
          </div>
        )}
      </div>

      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  data-testid="input-new-user-first-name"
                />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  data-testid="input-new-user-last-name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                data-testid="input-new-user-email"
              />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                data-testid="input-new-user-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                  <SelectTrigger data-testid="select-new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plan</Label>
                <Select value={newUser.subscriptionPlan} onValueChange={(val) => setNewUser({ ...newUser, subscriptionPlan: val })}>
                  <SelectTrigger data-testid="select-new-user-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="expanding">Expanding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Phone (optional)</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                data-testid="input-new-user-phone"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowAddUser(false)} data-testid="button-cancel-add-user">
              Cancel
            </Button>
            <Button
              onClick={() => createUserMutation.mutate(newUser)}
              disabled={createUserMutation.isPending || !newUser.firstName || !newUser.email || !newUser.password}
              data-testid="button-save-new-user"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
