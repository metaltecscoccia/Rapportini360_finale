import { storage } from "../storage";

/**
 * Middleware to verify that the organization has an active subscription or trial
 * Blocks access if trial expired or subscription inactive
 */
export const requireActiveSubscription = async (req: any, res: any, next: any) => {
  try {
    // Skip for public routes and login/logout
    if (!req.session.organizationId) {
      return next();
    }

    const org = await storage.getOrganization(req.session.organizationId);

    if (!org) {
      return res.status(403).json({
        error: "Organizzazione non trovata",
        code: "ORGANIZATION_NOT_FOUND",
      });
    }

    const now = new Date();

    // Check if trial is active
    if (org.subscriptionStatus === 'trial') {
      if (!org.trialEndDate || org.trialEndDate < now) {
        return res.status(403).json({
          error: "Trial scaduto. Effettua l'upgrade per continuare.",
          code: "TRIAL_EXPIRED",
          redirectTo: "/billing",
          trialEndDate: org.trialEndDate,
        });
      }
      // Trial still valid
      return next();
    }

    // Check if subscription is active
    if (org.subscriptionStatus === 'active') {
      return next();
    }

    // Subscription inactive (past_due, canceled, incomplete, paused)
    return res.status(403).json({
      error: "Sottoscrizione inattiva. Aggiorna il metodo di pagamento per continuare.",
      code: "SUBSCRIPTION_INACTIVE",
      subscriptionStatus: org.subscriptionStatus,
      redirectTo: "/billing",
    });
  } catch (error) {
    console.error("Error in requireActiveSubscription middleware:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};

/**
 * Middleware to check plan limits (e.g., max employees)
 * Should be applied to specific routes like POST /api/users
 */
export const checkPlanLimits = async (req: any, res: any, next: any) => {
  try {
    // Only check limits for employee creation
    if (req.method === 'POST' && req.path === '/api/users') {
      const org = await storage.getOrganization(req.session.organizationId);

      if (!org) {
        return res.status(403).json({
          error: "Organizzazione non trovata",
          code: "ORGANIZATION_NOT_FOUND",
        });
      }

      // Get current employee count
      const activeUsers = await storage.getActiveUsers(org.id);
      const employeeCount = activeUsers.length;

      // Check if limit reached
      if (employeeCount >= (org.maxEmployees || 5)) {
        return res.status(403).json({
          error: `Limite dipendenti raggiunto (${org.maxEmployees}). Effettua l'upgrade per aggiungere più dipendenti.`,
          code: "EMPLOYEE_LIMIT_REACHED",
          currentCount: employeeCount,
          maxEmployees: org.maxEmployees,
          redirectTo: "/billing",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in checkPlanLimits middleware:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
};
