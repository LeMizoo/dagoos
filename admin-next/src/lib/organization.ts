export type OrganizationLike = {
  id?: string;
  name?: string;
  email?: string;
  type?: string;
  organizationId?: string;
  organization?: OrganizationLike;
};

export function resolveOrganization(
  me: OrganizationLike | null | undefined,
  organizations: OrganizationLike[] | null | undefined,
  expectedType: string,
): OrganizationLike | null {
  const orgFromMe = me?.organization;
  if (orgFromMe && orgFromMe.id) {
    return orgFromMe;
  }

  const orgId = me?.organizationId || me?.organization?.id;
  if (orgId && Array.isArray(organizations)) {
    const directMatch = organizations.find((org) => org.id === orgId);
    if (directMatch) {
      return directMatch;
    }
  }

  const list = Array.isArray(organizations) ? organizations : [];
  const byEmail = list.find((org) => org.email === me?.email && org.type === expectedType);
  if (byEmail) {
    return byEmail;
  }

  return list.find((org) => org.type === expectedType) ?? null;
}
