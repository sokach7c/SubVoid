import { verifyRequestAuth } from "@/lib/auth";

export type CurrentAdmin = {
  id: string;
  username: string;
  isAdmin: true;
  isBanned: false;
  aiAssistantEnabled: false;
  saveRequirementSatisfied: true;
  subscriptionCount: number;
  quota: {
    maxSubscriptions: number;
  };
};

export async function getCurrentAdmin(request?: Request): Promise<CurrentAdmin | null> {
  if (!request) return null;
  const payload = await verifyRequestAuth(request);
  if (!payload) return null;

  return {
    id: payload.username,
    username: payload.username,
    isAdmin: true,
    isBanned: false,
    aiAssistantEnabled: false,
    saveRequirementSatisfied: true,
    subscriptionCount: 0,
    quota: { maxSubscriptions: 1000 },
  };
}

export async function isSetupRequired(): Promise<boolean> {
  return false;
}
