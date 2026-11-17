import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useAuthStore } from '../store/authStore';
import { REFRESH_SESSION_MUTATION } from '../graphql/refreshSessionMutation';

/**
 * Apollo Client Setup — per 01-auth.md (lines 50-66)
 *
 * RefreshSession contract:
 *   mutation RefreshSession {
 *     RefreshSession(object: { session_token: "..." }) {
 *       access_token, token, session_id, session_token, roles,
 *       active_role, active_branch_id
 *     }
 *   }
 *
 * Notes:
 *   - No Bearer token required (Hasura role: anonymous)
 *   - Used for silent token rotation on app load and on JWT expiry
 */

// ---------------------------------------------------------------------------
// 1. Refresh client — NO auth link (RefreshSession uses anonymous role)
// ---------------------------------------------------------------------------
const refreshHttpLink = createHttpLink({
  uri: '/v1/graphql',
  credentials: 'include',
});

export const refreshClient = new ApolloClient({
  link: refreshHttpLink,
  cache: new InMemoryCache(),
});

// ---------------------------------------------------------------------------
// 2. Main http link
// ---------------------------------------------------------------------------
const httpLink = createHttpLink({
  uri: '/v1/graphql',
  credentials: 'include',
});

// ---------------------------------------------------------------------------
// 3. Auth link — attaches Bearer access token to every request
// ---------------------------------------------------------------------------
const authLink = setContext((_, { headers }) => {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('smb_access_token')
      : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// ---------------------------------------------------------------------------
// 4. Refresh state — shared across concurrent failed requests
// ---------------------------------------------------------------------------
let isRefreshing = false;
let refreshPromise = null;

/**
 * Perform the RefreshSession mutation.
 * Reads session_token from localStorage, calls the backend,
 * and updates localStorage + Zustand auth store on success.
 */
const performRefresh = async () => {
  const sessionToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('smb_session_token')
      : null;
  if (!sessionToken) {
    throw new Error('No session token available for refresh');
  }

  const res = await refreshClient.mutate({
    mutation: REFRESH_SESSION_MUTATION,
    variables: { object: { session_token: sessionToken } },
  });

  if (res.error) {
    throw res.error;
  }

  const d = res.data.RefreshSession;

  // Update localStorage
  localStorage.setItem('smb_access_token', d.access_token);
  localStorage.setItem('smb_session_token', d.session_token);
  localStorage.setItem('smb_session_id', d.session_id);

  // Update Zustand auth store
  const { setAuth } = useAuthStore.getState();
  setAuth({
    accessToken: d.access_token,
    sessionToken: d.session_token,
    sessionId: d.session_id,
    activeRole: d.active_role,
    schoolId: d.school_id,
    roles: d.roles,
  });

  return d;
};

/**
 * Logout helper — clears localStorage and Zustand store.
 */
const logout = () => {
  const { logout: clearAuth } = useAuthStore.getState();
  localStorage.removeItem('smb_access_token');
  localStorage.removeItem('smb_session_token');
  localStorage.removeItem('smb_session_id');
  clearAuth();
};

/**
 * Detect JWT / authentication errors from Hasura.
 */
const isJwtError = (error) => {
  if (error.graphQLErrors) {
    for (const ge of error.graphQLErrors) {
      if (ge.extensions?.code === 'JWT_EXPIRED') return true;
      if (ge.extensions?.code === 'INVALID_JWT') return true;
      if (ge.extensions?.http?.status === 401) return true;
      if (ge.message && /jwt|token|expired/i.test(ge.message)) return true;
    }
  }
  if (error.networkError && error.networkError.statusCode === 401) {
    return true;
  }
  return false;
};

// ---------------------------------------------------------------------------
// 5. Refresh link — intercepts JWT errors, refreshes token, retries request
// ---------------------------------------------------------------------------
const refreshLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    forward(operation).subscribe({
      next: (result) => observer.next(result),

      error: async (error) => {
        // Only handle JWT/auth errors; pass other errors through
        if (!isJwtError(error)) {
          observer.error(error);
          return;
        }

        // If a refresh is already in flight, wait for it
        if (isRefreshing) {
          try {
            await refreshPromise;
            forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
            });
          } catch (refreshErr) {
            observer.error(refreshErr);
          }
          return;
        }

        // Start a new refresh (only one at a time)
        isRefreshing = true;
        refreshPromise = performRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

        try {
          await refreshPromise;
          // Retry the original operation with the new token
          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
          });
        } catch (refreshErr) {
          // Refresh failed — logout the user
          logout();
          observer.error(refreshErr);
        }
      },

      complete: () => observer.complete(),
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Build link chain: refreshLink -> authLink -> httpLink
// ---------------------------------------------------------------------------
const link = refreshLink.concat(authLink).concat(httpLink);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
