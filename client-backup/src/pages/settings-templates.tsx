import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Edit2,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface SettingsData {
  channels: any[];
  listings: any[];
  templates: Array<{
    id: string;
    name: string;
    body: string;
  }>;
  reminderSettings: any;
}

export default function SettingsTemplatesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, name, body }: { id: string; name: string; body: string }) => {
      await apiRequest("PATCH", `/api/templates/${id}`, { name, body });
    },
    onSuccess: () => {
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Template saved" });
    },
    onError: () => {
      toast({ title: "Failed to save template", variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; body: string }) => {
      await apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      setCreatingTemplate(false);
      setNewTemplateName("");
      setNewTemplateBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Template created" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Template deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b sticky top-0 bg-background z-50">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
            onClick={() => setLocation("/settings")}
            data-testid="button-back-templates"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go back</span>
          </button>
          <h1 className="text-lg font-semibold" data-testid="text-templates-title">Templates</h1>
        </div>
        {!creatingTemplate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreatingTemplate(true)}
            data-testid="button-create-template"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New
          </Button>
        )}
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {creatingTemplate && (
          <Card className="p-3.5" data-testid="card-new-template">
            <div className="space-y-2.5">
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name"
                data-testid="input-new-template-name"
              />
              <Textarea
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="Template body"
                className="min-h-[80px] text-sm"
                data-testid="input-new-template-body"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    createTemplateMutation.mutate({
                      name: newTemplateName.trim(),
                      body: newTemplateBody.trim(),
                    })
                  }
                  disabled={
                    createTemplateMutation.isPending ||
                    !newTemplateName.trim() ||
                    !newTemplateBody.trim()
                  }
                  data-testid="button-save-new-template"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreatingTemplate(false);
                    setNewTemplateName("");
                    setNewTemplateBody("");
                  }}
                  data-testid="button-cancel-new-template"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {data?.templates.map((tmpl) => (
          <Card key={tmpl.id} className="p-3.5" data-testid={`template-setting-${tmpl.id}`}>
            {editingTemplate === tmpl.id ? (
              <div className="space-y-2.5">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  data-testid="input-template-name"
                />
                <Textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Template body"
                  className="min-h-[80px] text-sm"
                  data-testid="input-template-body"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateTemplateMutation.mutate({
                        id: tmpl.id,
                        name: templateName,
                        body: templateBody,
                      })
                    }
                    disabled={updateTemplateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTemplate(null)}
                    data-testid="button-cancel-edit-template"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{tmpl.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {tmpl.body}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingTemplate(tmpl.id);
                      setTemplateName(tmpl.name);
                      setTemplateBody(tmpl.body);
                    }}
                    data-testid={`button-edit-template-${tmpl.id}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={deleteTemplateMutation.isPending}
                        data-testid={`button-delete-template-${tmpl.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{tmpl.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`button-cancel-delete-${tmpl.id}`}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTemplateMutation.mutate(tmpl.id)}
                          className={buttonVariants({ variant: "destructive" })}
                          data-testid={`button-confirm-delete-${tmpl.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </Card>
        ))}

        {(!data?.templates || data.templates.length === 0) && !creatingTemplate && (
          <div className="py-8 text-center border rounded-md">
            <p className="text-xs text-muted-foreground">
              No templates yet. Create one to speed up messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
