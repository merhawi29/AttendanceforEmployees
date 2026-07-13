const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const requestUrl =
    endpoint.includes("/attendance/settings") ||
    endpoint.includes("/admin/settings") ||
    endpoint.includes("/attendance/today")
      ? `${API_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}_=${Date.now()}`
      : `${API_URL}${endpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    cache:
      endpoint.includes("/settings") || endpoint.includes("/attendance/today")
        ? "no-store"
        : options.cache,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data: {
    success?: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
    code?: string;
  };

  try {
    data = await response.json();
  } catch {
    throw new ApiError("Invalid server response", response.status);
  }

  if (
    response.status === 401 &&
    retry &&
    !endpoint.startsWith("/auth/login") &&
    !endpoint.startsWith("/auth/refresh") &&
    !endpoint.startsWith("/auth/logout")
  ) {
    if (!refreshPromise) {
      refreshPromise = refreshSession().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiRequest<T>(endpoint, options, false);
    }
  }

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || "Request failed",
      response.status,
      data.errors,
      data.code
    );
  }

  return data.data as T;
}
