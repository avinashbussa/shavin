import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs, TabsList, TabsTrigger } from "../../packages/ui/src/primitives/Tabs/Tabs";

describe("TabsList variant reaches its triggers", () => {
  const classes = (variant?: "segmented") =>
    render(
      <Tabs defaultValue="a" items={[]}>
        <TabsList variant="segmented" aria-label="x">
          <TabsTrigger value="a" variant={variant}>A</TabsTrigger>
        </TabsList>
      </Tabs>,
    ).getByRole("tab").className;

  it("a trigger without its own variant matches the list", () => {
    const inherited = classes();
    screen.getByRole("tab").remove();
    expect(inherited).toBe(classes("segmented"));
  });
});
