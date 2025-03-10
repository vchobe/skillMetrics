import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";

// Form schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  projectName: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().min(1, "Location is required"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Suggestions states
  const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  // Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      projectName: user?.projectName || "",
      clientName: user?.clientName || "",
      role: user?.role || "",
      location: user?.location || "",
    },
  });

  // Get suggestions from API
  const { data: suggestions } = useQuery<{
    projects: string[];
    clients: string[];
    roles: string[];
    locations: string[];
  }>({
    queryKey: ["/api/suggestions"],
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        projectName: user.projectName || "",
        clientName: user.clientName || "",
        role: user.role || "",
        location: user.location || "",
      });
    }
  }, [user, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("PUT", `/api/users/${user.id}/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile-history"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle suggestions for project name
  const handleProjectNameChange = (value: string) => {
    form.setValue("projectName", value);
    if (value.length >= 2 && suggestions?.projects) {
      const matches = suggestions.projects
        .filter((project) => project.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setProjectSuggestions(matches);
    } else {
      setProjectSuggestions([]);
    }
  };

  // Handle suggestions for client name
  const handleClientNameChange = (value: string) => {
    form.setValue("clientName", value);
    if (value.length >= 2 && suggestions?.clients) {
      const matches = suggestions.clients
        .filter((client) => client.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setClientSuggestions(matches);
    } else {
      setClientSuggestions([]);
    }
  };

  // Handle suggestions for role
  const handleRoleChange = (value: string) => {
    form.setValue("role", value);
    if (value.length >= 2 && suggestions?.roles) {
      const matches = suggestions.roles
        .filter((role) => role.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setRoleSuggestions(matches);
    } else {
      setRoleSuggestions([]);
    }
  };

  // Handle suggestions for location
  const handleLocationChange = (value: string) => {
    form.setValue("location", value);
    if (value.length >= 2 && suggestions?.locations) {
      const matches = suggestions.locations
        .filter((location) => location.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setLocationSuggestions(matches);
    } else {
      setLocationSuggestions([]);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Autocomplete
                        label="Project name"
                        id="project-name"
                        value={field.value}
                        onChange={handleProjectNameChange}
                        suggestions={projectSuggestions}
                        required
                        error={form.formState.errors.projectName?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Autocomplete
                        label="Client name"
                        id="client-name"
                        value={field.value}
                        onChange={handleClientNameChange}
                        suggestions={clientSuggestions}
                        required
                        error={form.formState.errors.clientName?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Autocomplete
                        label="Role"
                        id="role"
                        value={field.value}
                        onChange={handleRoleChange}
                        suggestions={roleSuggestions}
                        required
                        error={form.formState.errors.role?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Autocomplete
                        label="Location"
                        id="location"
                        value={field.value}
                        onChange={handleLocationChange}
                        suggestions={locationSuggestions}
                        required
                        error={form.formState.errors.location?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
