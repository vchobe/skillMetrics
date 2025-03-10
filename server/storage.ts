import { 
  users, skills, skillHistory, profileHistory,
  User, InsertUser, Skill, InsertSkill, SkillHistory, InsertSkillHistory, ProfileHistory, InsertProfileHistory 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, desc } from "drizzle-orm";
import { db, pool } from "./db";
import bcrypt from "bcrypt";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Skill methods
  getSkills(): Promise<Skill[]>;
  getSkillById(id: number): Promise<Skill | undefined>;
  getSkillsByUserId(userId: number): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, updates: Partial<Skill>): Promise<Skill>;
  
  // Skill history methods
  getSkillHistoryBySkillId(skillId: number): Promise<SkillHistory[]>;
  createSkillHistory(history: InsertSkillHistory): Promise<SkillHistory>;
  
  // Profile history methods
  getProfileHistoryByUserId(userId: number): Promise<ProfileHistory[]>;
  createProfileHistory(history: InsertProfileHistory): Promise<ProfileHistory>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize admin user (for first run only)
    this.initializeAdminUser();
    this.initializeDemoUser();
  }

  private async initializeAdminUser() {
    try {
      const adminExists = await this.getUserByEmail("admin@example.com");
      if (!adminExists) {
        console.log("Creating admin account...");
        const hashedPassword = await bcrypt.hash("adminpass", 10);
        await this.createUser({
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
          firstName: "Admin",
          lastName: "User",
          projectName: null,
          clientName: null,
          location: null,
        });
        console.log("Admin account created successfully.");
        console.log("Email: admin@example.com, Password: adminpass");
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  }
  
  private async initializeDemoUser() {
    try {
      const demoExists = await this.getUserByEmail("demo@example.com");
      if (!demoExists) {
        const hashedPassword = await bcrypt.hash("password123", 10);
        const demoUser = await this.createUser({
          email: "demo@example.com",
          password: hashedPassword,
          firstName: "Demo",
          lastName: "User",
          projectName: "Cloud Migration",
          clientName: "Acme Corp",
          role: "Software Engineer",
          location: "New York, NY"
        });
        
        // Create some sample skills for the demo user
        if (demoUser) {
          await this.createSkill({
            name: "JavaScript",
            userId: demoUser.id,
            level: "Expert",
            certificationUrl: null,
            updatedAt: new Date()
          });
          
          await this.createSkill({
            name: "TypeScript",
            userId: demoUser.id,
            level: "Intermediate",
            certificationUrl: "https://credentials.example.com/typescript/123",
            updatedAt: new Date()
          });
          
          await this.createSkill({
            name: "React",
            userId: demoUser.id,
            level: "Beginner",
            certificationUrl: null,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error initializing demo user:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      // Get current user to create history record
      const currentUser = await this.getUser(id);
      if (!currentUser) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // Track changes for fields that should be recorded in history
      const fieldsToTrack = ["role", "projectName", "clientName", "location"];
      for (const field of fieldsToTrack) {
        if (updates[field as keyof typeof updates] !== undefined && 
            updates[field as keyof typeof updates] !== currentUser[field as keyof User]) {
          await this.createProfileHistory({
            userId: id,
            field,
            previousValue: currentUser[field as keyof User] as string,
            newValue: updates[field as keyof typeof updates] as string,
            updatedAt: new Date()
          });
        }
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ ...updates })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async getSkills(): Promise<Skill[]> {
    try {
      return await db.select().from(skills);
    } catch (error) {
      console.error("Error getting all skills:", error);
      return [];
    }
  }

  async getSkillById(id: number): Promise<Skill | undefined> {
    try {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));
      return skill;
    } catch (error) {
      console.error("Error getting skill by id:", error);
      return undefined;
    }
  }

  async getSkillsByUserId(userId: number): Promise<Skill[]> {
    try {
      return await db
        .select()
        .from(skills)
        .where(eq(skills.userId, userId));
    } catch (error) {
      console.error("Error getting skills by user id:", error);
      return [];
    }
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    try {
      const now = new Date();
      const [skill] = await db
        .insert(skills)
        .values({ ...insertSkill, updatedAt: now })
        .returning();
      
      // Create initial history record for new skill
      await this.createSkillHistory({
        skillId: skill.id,
        userId: skill.userId,
        name: skill.name,
        level: skill.level,
        certificationUrl: skill.certificationUrl,
        updatedAt: now
      });
      
      return skill;
    } catch (error) {
      console.error("Error creating skill:", error);
      throw error;
    }
  }

  async updateSkill(id: number, updates: Partial<Skill>): Promise<Skill> {
    try {
      const now = new Date();
      // Get the current skill to store in history
      const currentSkill = await this.getSkillById(id);
      
      if (!currentSkill) {
        throw new Error(`Skill with id ${id} not found`);
      }
      
      // Create a history record for the change
      if (
        updates.level !== undefined && updates.level !== currentSkill.level ||
        updates.certificationUrl !== undefined && updates.certificationUrl !== currentSkill.certificationUrl
      ) {
        await this.createSkillHistory({
          skillId: id,
          userId: currentSkill.userId,
          name: currentSkill.name,
          level: updates.level || currentSkill.level,
          certificationUrl: updates.certificationUrl !== undefined ? updates.certificationUrl : currentSkill.certificationUrl,
          updatedAt: now
        });
      }
      
      const [updatedSkill] = await db
        .update(skills)
        .set({ ...updates, updatedAt: now })
        .where(eq(skills.id, id))
        .returning();
      
      return updatedSkill;
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error;
    }
  }

  async getSkillHistoryBySkillId(skillId: number): Promise<SkillHistory[]> {
    try {
      return await db
        .select()
        .from(skillHistory)
        .where(eq(skillHistory.skillId, skillId))
        .orderBy(desc(skillHistory.updatedAt));
    } catch (error) {
      console.error("Error getting skill history:", error);
      return [];
    }
  }

  async createSkillHistory(insertHistory: InsertSkillHistory): Promise<SkillHistory> {
    try {
      const [history] = await db
        .insert(skillHistory)
        .values(insertHistory)
        .returning();
      
      return history;
    } catch (error) {
      console.error("Error creating skill history:", error);
      throw error;
    }
  }

  async getProfileHistoryByUserId(userId: number): Promise<ProfileHistory[]> {
    try {
      return await db
        .select()
        .from(profileHistory)
        .where(eq(profileHistory.userId, userId))
        .orderBy(desc(profileHistory.updatedAt));
    } catch (error) {
      console.error("Error getting profile history:", error);
      return [];
    }
  }

  async createProfileHistory(insertHistory: InsertProfileHistory): Promise<ProfileHistory> {
    try {
      const [history] = await db
        .insert(profileHistory)
        .values(insertHistory)
        .returning();
      
      return history;
    } catch (error) {
      console.error("Error creating profile history:", error);
      throw error;
    }
  }
}

// Memory storage implementation (kept for reference and fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private skillHistory: Map<number, SkillHistory>;
  private profileHistory: Map<number, ProfileHistory>;
  private userIdCounter: number;
  private skillIdCounter: number;
  private skillHistoryIdCounter: number;
  private profileHistoryIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.skillHistory = new Map();
    this.profileHistory = new Map();
    this.userIdCounter = 1;
    this.skillIdCounter = 1;
    this.skillHistoryIdCounter = 1;
    this.profileHistoryIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add a sample user for testing
    this.createUser({
      email: "demo@example.com",
      password: "password123", // This will be hashed in auth.ts
      firstName: "Demo",
      lastName: "User",
      projectName: "Cloud Migration",
      clientName: "Acme Corp",
      role: "Software Engineer",
      location: "New York, NY"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Skill methods
  async getSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }
  
  async getSkillById(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }
  
  async getSkillsByUserId(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId,
    );
  }
  
  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = this.skillIdCounter++;
    const now = new Date();
    const skill = { 
      id, 
      ...insertSkill,
      updatedAt: now
    };
    this.skills.set(id, skill);
    return skill;
  }
  
  async updateSkill(id: number, updates: Partial<Skill>): Promise<Skill> {
    const skill = await this.getSkillById(id);
    if (!skill) {
      throw new Error(`Skill with ID ${id} not found`);
    }
    
    const updatedSkill = { 
      ...skill, 
      ...updates,
      updatedAt: new Date() 
    };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }
  
  // Skill history methods
  async getSkillHistoryBySkillId(skillId: number): Promise<SkillHistory[]> {
    return Array.from(this.skillHistory.values())
      .filter((history) => history.skillId === skillId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async createSkillHistory(insertHistory: InsertSkillHistory): Promise<SkillHistory> {
    const id = this.skillHistoryIdCounter++;
    const now = new Date();
    const history = { 
      id, 
      ...insertHistory,
      updatedAt: now
    };
    this.skillHistory.set(id, history);
    return history;
  }
  
  // Profile history methods
  async getProfileHistoryByUserId(userId: number): Promise<ProfileHistory[]> {
    return Array.from(this.profileHistory.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async createProfileHistory(insertHistory: InsertProfileHistory): Promise<ProfileHistory> {
    const id = this.profileHistoryIdCounter++;
    const now = new Date();
    const history = { 
      id, 
      ...insertHistory,
      updatedAt: now
    };
    this.profileHistory.set(id, history);
    return history;
  }
}

// Use database storage
export const storage = new DatabaseStorage();
