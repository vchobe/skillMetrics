import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User, loginUserSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendTemporaryPasswordEmail } from "./email";
import bcrypt from "bcrypt";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Generate a random temporary password
function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "skillmetrix-secret-key";
  
  // Admin account creation is now handled in storage.ts
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body against schema (only email is required)
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate a temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      // Hash the temporary password
      const hashedPassword = await hashPassword(temporaryPassword);

      // Create the user with temporary password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        // Set defaults for optional fields to prevent type errors
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        projectName: userData.projectName || null,
        clientName: userData.clientName || null,
        role: userData.role || null,
        location: userData.location || null,
      });

      // Send the temporary password via email
      await sendTemporaryPasswordEmail(userData.email, temporaryPassword);

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body against schema
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: User) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      // Validate that email is provided
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal if the email exists or not
        return res.status(200).json({ message: "If your email is registered, you will receive password reset instructions" });
      }

      // Generate a temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      // Hash the temporary password
      const hashedPassword = await hashPassword(temporaryPassword);

      // Update user's password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Send the temporary password via email
      await sendTemporaryPasswordEmail(email, temporaryPassword);

      return res.status(200).json({ message: "If your email is registered, you will receive password reset instructions" });
    } catch (error) {
      console.error("Password reset error:", error);
      next(error);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
