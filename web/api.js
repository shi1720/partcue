/** Same-origin JSON client. Session cookie is HttpOnly; CSRF token remains in memory. */
export class ApiClient {
  csrfToken = null;
  accountId = null;
  authEpoch = 0;
  constructor({ fetchImpl = globalThis.fetch } = {}) {
    // Native browser fetch requires its Window receiver when stored as a method.
    this.fetchImpl = fetchImpl.bind(globalThis);
  }
  async request(path, method = "GET", body) {
    const credentialRequest =
      method === "POST" &&
      ["/api/auth/login", "/api/auth/register"].includes(path);
    const changesAuth =
      credentialRequest || (method === "POST" && path === "/api/auth/logout");
    const epoch = changesAuth ? ++this.authEpoch : this.authEpoch;
    const headers = {};
    if (this.accountId && !credentialRequest)
      headers["x-partcue-account"] = this.accountId;
    if (body !== undefined) headers["content-type"] = "application/json";
    if (method !== "GET" && this.csrfToken)
      headers["x-csrf-token"] = this.csrfToken;
    let response;
    try {
      response = await this.fetchImpl(path, {
        method,
        headers,
        credentials: "same-origin",
        cache: "no-store",
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (cause) {
      const error = new Error(
        "The companion server could not be reached. Your current bench is still in this tab. Export it before reloading.",
      );
      error.code = "NETWORK";
      error.cause = cause;
      throw error;
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an unreadable response. Export your bench and try again.",
      );
    }
    if (!response.ok) {
      if (data.error?.code === "AUTH_REQUIRED" && epoch === this.authEpoch) {
        this.csrfToken = null;
        this.accountId = null;
      }
      const error = new Error(
        data.error?.message || "The request could not be completed.",
      );
      error.code = data.error?.code || "REQUEST_FAILED";
      error.status = response.status;
      throw error;
    }
    if (epoch === this.authEpoch) {
      if (
        data.user &&
        ["/api/auth/me", "/api/auth/login", "/api/auth/register"].includes(path)
      ) {
        this.accountId = data.user.id;
        this.csrfToken = data.csrfToken;
      }
      if (path === "/api/auth/logout") {
        this.accountId = null;
        this.csrfToken = null;
      }
    }
    return data;
  }
}
