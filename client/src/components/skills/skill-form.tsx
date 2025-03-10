import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink } from "lucide-react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SKILL_LEVELS, Skill } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";

interface SkillFormProps {
  skill?: Skill;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const skillFormSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  level: z.string().min(1, "Skill level is required"),
  certificationUrl: z.string().url("Must be a valid URL").or(z.literal("")),
});

type SkillFormValues = z.infer<typeof skillFormSchema>;

export function SkillForm({ skill, isOpen, onOpenChange }: SkillFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  
  const {
    setValue,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: skill?.name || "",
      level: skill?.level || "",
      certificationUrl: skill?.certificationUrl || "",
    },
  });

  // Get skills for the current user
  const { data: userSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get global skill name suggestions from all users
  const { data: suggestions } = useQuery<{
    skills: string[];
    projects: string[];
    clients: string[];
    roles: string[];
    locations: string[];
  }>({
    queryKey: ["/api/suggestions"],
  });
  
  // Get the current value of the skill name field
  const skillName = watch("name");

  // Reset form when skill prop changes
  useEffect(() => {
    if (skill) {
      reset({
        name: skill.name,
        level: skill.level,
        certificationUrl: skill.certificationUrl || "",
      });
    } else {
      reset({
        name: "",
        level: "",
        certificationUrl: "",
      });
    }
  }, [skill, reset]);

  // Update suggestions when skill name changes
  useEffect(() => {
    if (skillName && skillName.length >= 1 && suggestions?.skills) {
      // Combine suggestions from global pool and user's own skills
      const userSkillNames = userSkills ? [...new Set(userSkills.map(s => s.name))] : [];
      const allSuggestions = suggestions.skills.concat(userSkillNames);
      const uniqueSuggestions = [...new Set(allSuggestions)];
      
      // Filter for matching skills
      const matches = uniqueSuggestions
        .filter(name => name.toLowerCase().includes(skillName.toLowerCase()))
        .slice(0, 7); // Show more suggestions
      
      setSkillSuggestions(matches);
    } else {
      setSkillSuggestions([]);
    }
  }, [skillName, suggestions, userSkills]);

  const saveSkillMutation = useMutation({
    mutationFn: async (data: SkillFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const payload = {
        ...data,
        userId: user.id,
      };

      if (skill) {
        // Update existing skill
        return apiRequest("PUT", `/api/skills/${skill.id}`, payload);
      } else {
        // Create new skill
        return apiRequest("POST", "/api/skills", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      onOpenChange(false);
      toast({
        title: skill ? "Skill updated" : "Skill added",
        description: skill
          ? "Skill has been updated successfully"
          : "Skill has been added successfully",
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

  const onSubmit = (data: SkillFormValues) => {
    saveSkillMutation.mutate(data);
  };

  const handleSkillSuggestionSelect = (value: string) => {
    setValue("name", value);
    setSkillSuggestions([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{skill ? "Update Skill" : "Add New Skill"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <Autocomplete
              label="Skill Name"
              id="skill-name"
              value={skillName}
              onChange={(value) => setValue("name", value)}
              suggestions={skillSuggestions}
              placeholder="e.g., JavaScript, React, Python"
              required
              error={errors.name?.message}
            />

            <div className="space-y-2">
              <Label htmlFor="skill-level">
                Skill Level<span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("level")}
                onValueChange={(value) => setValue("level", value)}
              >
                <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-sm text-red-500">{errors.level.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification-url">
                Certification URL (optional)
              </Label>
              <div className="relative">
                <Input
                  id="certification-url"
                  placeholder="https://www.credly.com/badges/your-badge-id"
                  {...register("certificationUrl")}
                  className={errors.certificationUrl ? "border-red-500" : ""}
                />
                {watch("certificationUrl") && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <a 
                      href={watch("certificationUrl")} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
              {errors.certificationUrl ? (
                <p className="text-sm text-red-500">{errors.certificationUrl.message}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Add the URL to your certification badge on Credly or other verification platforms
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={saveSkillMutation.isPending}
            >
              {saveSkillMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
