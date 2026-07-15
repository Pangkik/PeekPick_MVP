import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportDialog from "./ReportDialog";
import { clearToken } from "@/lib/api";

function mockFetch(status: number, body: unknown = null) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => (name === "content-type" ? "application/json" : null) },
    json: async () => body,
  });
}

describe("ReportDialog", () => {
  beforeEach(() => clearToken());
  afterEach(() => vi.unstubAllGlobals());

  it("blocks submit and shows an inline error when reason is empty", () => {
    const fetchMock = mockFetch(201, { id: 1 });
    vi.stubGlobal("fetch", fetchMock);
    render(<ReportDialog open onOpenChange={vi.fn()} targetType="item" targetId="1" title="Report item" />);

    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Tell us what's wrong");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the trimmed reason and closes the dialog on success", async () => {
    const fetchMock = mockFetch(201, { id: 1 });
    vi.stubGlobal("fetch", fetchMock);
    const onOpenChange = vi.fn();

    render(<ReportDialog open onOpenChange={onOpenChange} targetType="item" targetId="42" title="Report item" />);

    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "  spam listing  " } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/reports");
    expect(init.body).toBe(JSON.stringify({ targetType: "item", targetId: "42", reason: "spam listing" }));
  });
});
