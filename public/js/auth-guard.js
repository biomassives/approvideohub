// /public/js/auth-guard.js

import { verifySession } from './lattice-auth.js';
import { getCurrentUser, checkAccess, signOut } from './supabase-auth.js';

/**
 * Ensures the user has a valid Lattice & Supabase session and proper access.
 * Redirects to /login.html on failure.
 * @returns {Promise<object>} The authenticated user object.
 */
export async function requireAuthOrRedirect() {
  // 1️⃣ Verify Lattice session (handles redirect internally on failure)
  const sessionValid = await verifySession();
  if (!sessionValid) {
    // verifySession already redirected on invalid
    throw new Error('Lattice session invalid');
  }

  // 2️⃣ Fetch Supabase user
  const user = await getCurrentUser();
  if (!user) {
    await signOut();
    window.location.href = '/login.html';
    throw new Error('Supabase session missing');
  }

  // 3️⃣ Role-based access (ensure at least 'user')
  const { allowed } = await checkAccess('user')();
  if (!allowed) {
    await signOut();
    window.location.href = '/login.html?reason=no_access';
    throw new Error('Access denied');
  }

  return user;
}
