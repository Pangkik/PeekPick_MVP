import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api, ApiError, getToken, setToken, clearToken } from "./api";

function mockFetch(status: number, body: unknown = null, contentType = "application/json") {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => (name === "content-type" ? contentType : null) },
    json: async () => body,
  });
}

describe("token storage", () => {
  afterEach(() => clearToken());

  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("removes the token on clear", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("api requests", () => {
  beforeEach(() => clearToken());
  afterEach(() => vi.unstubAllGlobals());

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { items: [1, 2] }));
    const data = await api.get<{ items: number[] }>("/api/discovery");
    expect(data).toEqual({ items: [1, 2] });
  });

  it("sends method, JSON body and Content-Type header on POST", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await api.post("/api/swipes", { itemId: "1", direction: "right" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/swipes");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ itemId: "1", direction: "right" }));
  });

  it("sends FormData bodies as-is without a JSON Content-Type", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("file", "x");
    await api.post("/api/upload", form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("attaches an Authorization header when a token is present", async () => {
    setToken("my-token");
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal("fetch", fetchMock);
    await api.get("/api/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("omits the Authorization header when there is no token", async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal("fetch", fetchMock);
    await api.get("/api/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Authorization"]).toBeUndefined();
  });

  it("returns null for non-JSON responses", async () => {
    vi.stubGlobal("fetch", mockFetch(204, null, "text/plain"));
    const data = await api.delete("/api/items/1");
    expect(data).toBeNull();
  });

  it("throws an ApiError with the server message on failure", async () => {
    vi.stubGlobal("fetch", mockFetch(400, { error: "Title is required" }));
    await expect(api.post("/api/items", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Title is required",
    });
  });

  it("throws a default ApiError message when the server gives none", async () => {
    vi.stubGlobal("fetch", mockFetch(500, null));
    await expect(api.get("/api/items")).rejects.toMatchObject({
      status: 500,
      message: "Request failed (500)",
    });
  });

  it("clears the token and throws on 401", async () => {
    setToken("stale-token");
    // Already on /login so the request layer won't attempt a redirect navigation.
    window.history.pushState({}, "", "/login");
    vi.stubGlobal("fetch", mockFetch(401));

    await expect(api.get("/api/me")).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
  });
});
