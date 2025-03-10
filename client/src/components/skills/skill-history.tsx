import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkillHistory as SkillHistoryType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Award, ArrowUpRight, Clock } from "lucide-react";

interface SkillHistoryProps {
  skillId: number;
  skillName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkillHistory({ skillId, skillName, isOpen, onOpenChange }: SkillHistoryProps) {
  const { data: history, isLoading } = useQuery<SkillHistoryType[]>({
    queryKey: [`/api/skills/${skillId}/history`],
    enabled: isOpen && !!skillId,
  });

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Skill History: {skillName}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse">Loading history...</div>
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Skill Progression Timeline</h3>
                </div>
                <p className="text-xs text-gray-500">
                  This timeline shows how your skill level has progressed over time, including when certifications were added or updated.
                </p>
              </div>

              <div className="relative pl-8 space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {history.map((item, index) => {
                  // Determine if this entry shows a certification change
                  const hasCertification = !!item.certificationUrl;
                  const prevItem = index < history.length - 1 ? history[index + 1] : null;
                  const certificationChanged = prevItem && 
                    ((!prevItem.certificationUrl && hasCertification) || 
                     (prevItem.certificationUrl !== item.certificationUrl));
                  
                  return (
                    <div key={item.id} className="relative">
                      {/* Timeline marker */}
                      <div className="absolute -left-8 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-gray-200">
                        {hasCertification ? (
                          <Award className="h-3 w-3 text-primary-500" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Event card */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge variant="outline" className={getLevelBadgeColor(item.level)}>
                              {item.level}
                            </Badge>
                            {certificationChanged && (
                              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
                                Certification Added
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(item.updatedAt)}</span>
                        </div>
                        
                        {hasCertification && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                              <Award className="h-4 w-4 text-amber-500 mr-2" />
                              <span className="text-sm font-medium">Certified</span>
                            </div>
                            <a
                              href={item.certificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                            >
                              View Badge <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No history available for this skill.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
