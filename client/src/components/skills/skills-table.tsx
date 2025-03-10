import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { Skill } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SkillForm } from "./skill-form";
import { SkillHistory } from "./skill-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SkillsTable() {
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>(undefined);

  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const handleAddSkill = () => {
    setSelectedSkill(undefined);
    setIsAddSkillOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsAddSkillOpen(true);
  };

  const handleViewHistory = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsHistoryOpen(true);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-blue-100 text-blue-800";
      case "Intermediate":
        return "bg-green-100 text-green-800";
      case "Expert":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: Date | string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Skills Metrics</CardTitle>
        <Button onClick={handleAddSkill} className="inline-flex items-center">
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add New Skill
        </Button>
      </CardHeader>
      <CardContent>
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certification
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Loading skills...
                  </td>
                </tr>
              ) : skills && skills.length > 0 ? (
                skills.map((skill) => (
                  <tr key={skill.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {skill.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={getLevelBadgeColor(skill.level)}>
                        {skill.level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(skill.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {skill.certificationUrl ? (
                        <a
                          href={skill.certificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          View Certificate <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="link"
                        onClick={() => handleEditSkill(skill)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => handleViewHistory(skill)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No skills added yet. Click "Add New Skill" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Skill Form Dialog */}
        <SkillForm
          skill={selectedSkill}
          isOpen={isAddSkillOpen}
          onOpenChange={setIsAddSkillOpen}
        />

        {/* Skill History Dialog */}
        {selectedSkill && (
          <SkillHistory
            skillId={selectedSkill.id}
            skillName={selectedSkill.name}
            isOpen={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
