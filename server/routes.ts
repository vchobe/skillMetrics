import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertSkillSchema, insertProfileHistorySchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Admin middleware
  const ensureAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && req.user.email === "admin@example.com") {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  };
  
  // User routes
  app.get("/api/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user profile
  app.put("/api/users/:id/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Make sure user can only update their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Fields that can be updated
      const updatableFields = ["firstName", "lastName", "projectName", "clientName", "role", "location"];
      const profileUpdates: Record<string, string> = {};
      const historyEntries = [];
      
      // Check which fields changed and create history entries
      for (const field of updatableFields) {
        if (req.body[field] && req.body[field] !== currentUser[field as keyof typeof currentUser]) {
          profileUpdates[field] = req.body[field];
          
          // Create a profile history entry
          historyEntries.push({
            userId,
            field: field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase()),
            previousValue: currentUser[field as keyof typeof currentUser] as string || "",
            newValue: req.body[field]
          });
        }
      }
      
      // If any fields changed, update the user and create history entries
      if (Object.keys(profileUpdates).length > 0) {
        // Update user
        const updatedUser = await storage.updateUser(userId, profileUpdates);
        
        // Create history entries
        for (const entry of historyEntries) {
          await storage.createProfileHistory(entry);
        }
        
        res.json(updatedUser);
      } else {
        res.json(currentUser);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Skills routes
  app.get("/api/skills", ensureAuthenticated, async (req, res) => {
    try {
      const skills = await storage.getSkillsByUserId(req.user!.id);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post("/api/skills", ensureAuthenticated, async (req, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      
      // Ensure user can only create skills for themselves
      if (skillData.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const skill = await storage.createSkill(skillData);
      
      // Create a skill history entry
      await storage.createSkillHistory({
        skillId: skill.id,
        userId: skillData.userId,
        name: skillData.name,
        level: skillData.level,
        certificationUrl: skillData.certificationUrl,
      });
      
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  app.put("/api/skills/:id", ensureAuthenticated, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const skillData = insertSkillSchema.parse(req.body);
      
      // Ensure user can only update their own skills
      if (skillData.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get existing skill
      const existingSkill = await storage.getSkillById(skillId);
      if (!existingSkill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns this skill
      if (existingSkill.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if level or certification changed
      if (existingSkill.level !== skillData.level || 
          existingSkill.certificationUrl !== skillData.certificationUrl) {
        // Create a new skill history entry
        await storage.createSkillHistory({
          skillId,
          userId: skillData.userId,
          name: skillData.name,
          level: skillData.level,
          certificationUrl: skillData.certificationUrl,
        });
      }
      
      // Update the skill
      const updatedSkill = await storage.updateSkill(skillId, skillData);
      res.json(updatedSkill);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update skill" });
    }
  });

  app.get("/api/skills/:id/history", ensureAuthenticated, async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      
      // Get the skill to verify ownership
      const skill = await storage.getSkillById(skillId);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Ensure user owns this skill
      if (skill.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const history = await storage.getSkillHistoryBySkillId(skillId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill history" });
    }
  });

  // Profile history routes
  app.get("/api/profile-history", ensureAuthenticated, async (req, res) => {
    try {
      const history = await storage.getProfileHistoryByUserId(req.user!.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile history" });
    }
  });

  // Get all skills (admin only)
  app.get("/api/all-skills", ensureAdmin, async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all skills" });
    }
  });

  // Suggestions for autocomplete
  app.get("/api/suggestions", ensureAuthenticated, async (req, res) => {
    try {
      const skills = await storage.getSkills();
      const users = await storage.getUsers();
      
      // Extract unique values for each field
      const projects = [...new Set(users.map(u => u.projectName).filter(Boolean))];
      const clients = [...new Set(users.map(u => u.clientName).filter(Boolean))];
      const roles = [...new Set(users.map(u => u.role).filter(Boolean))];
      const locations = [...new Set(users.map(u => u.location).filter(Boolean))];
      const skillNames = [...new Set(skills.map(s => s.name))];
      
      res.json({
        projects,
        clients,
        roles,
        locations,
        skills: skillNames,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
