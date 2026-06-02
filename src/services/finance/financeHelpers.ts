import { getCurrentUser } from "../auth";

export async function getRequiredUserId(): Promise<number> {
  const user = await getCurrentUser();
  return user.id;
}
