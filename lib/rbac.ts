import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken, TokenPayload } from './auth';
import { Role } from './validators';

/**
 * Role hierarchy mapping:
 * - admin: access to all capabilities
 * - volunteer: access to inventory and volunteer functions + donor capabilities
 * - donor: access to donor dashboard and public campaign pages
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  donor: 1,
  volunteer: 2,
  admin: 3,
};

/**
 * Check if the user role meets the required role permission.
 */
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if the user role is among the explicitly allowed roles.
 */
export function isRoleAllowed(userRole: Role, allowedRoles: Role[]): boolean {
  if (userRole === 'admin') return true; // Admin has superuser access
  return allowedRoles.includes(userRole);
}

/**
 * Server-Side Defense in Depth:
 * Retrieves and cryptographically validates the session from cookies in Server Components & Server Actions.
 */
export async function getServerSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

/**
 * Enforces authentication and authorization inside Server Actions.
 * Throws structured errors if unauthenticated or forbidden.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<TokenPayload> {
  const session = await getServerSession();

  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required.');
  }

  if (allowedRoles && allowedRoles.length > 0 && !isRoleAllowed(session.role, allowedRoles)) {
    throw new Error(`FORBIDDEN: Role '${session.role}' is not authorized for this action.`);
  }

  return session;
}

/**
 * Defense-in-depth helper for Next.js Route Handlers (API endpoints).
 * Returns JSON error response directly if authentication or authorization fails.
 */
export async function authenticateRouteHandler(
  req: NextRequest,
  allowedRoles?: Role[]
): Promise<{ user: TokenPayload } | { response: NextResponse }> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  const user = await verifyToken(token);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Invalid or expired session token.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !isRoleAllowed(user.role, allowedRoles)) {
    return {
      response: NextResponse.json(
        {
          error: `Forbidden. Role '${user.role}' lacks permissions for this operation.`,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
