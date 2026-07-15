import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MatchScreen from "./MatchScreen";

function setup(overrides: Partial<React.ComponentProps<typeof MatchScreen>> = {}) {
  const onContinue = vi.fn();
  const onMessage = vi.fn();
  render(
    <MatchScreen
      myItem={{ title: "Old Guitar", photoUrl: "/guitar.jpg" }}
      theirItem={{ title: "Bicycle", owner: "Jamie" }}
      onContinue={onContinue}
      onMessage={onMessage}
      {...overrides}
    />
  );
  return { onContinue, onMessage };
}

describe("MatchScreen", () => {
  it("shows the trade headline and both item titles", () => {
    setup();
    expect(screen.getByText("It's a Trade!")).toBeInTheDocument();
    expect(screen.getByText("Old Guitar")).toBeInTheDocument();
    expect(screen.getByText("Bicycle")).toBeInTheDocument();
  });

  it("names the other user in the match summary", () => {
    setup();
    expect(screen.getByText("Trade request sent to Jamie")).toBeInTheDocument();
  });

  it("calls onMessage when the message button is clicked", () => {
    const { onMessage, onContinue } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Message Jamie/i }));
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("calls onContinue when Keep Swiping is clicked", () => {
    const { onContinue } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Keep Swiping/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders a photo when photoUrl is provided", () => {
    setup();
    expect(screen.getByAltText("Old Guitar")).toHaveAttribute("src", "/guitar.jpg");
  });

  it("falls back to a placeholder icon when no photoUrl is given", () => {
    setup({ theirItem: { title: "Bicycle", owner: "Jamie" } });
    expect(screen.queryByAltText("Bicycle")).not.toBeInTheDocument();
  });
});
