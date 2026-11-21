// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { controlsScheme, opposite, pageBackground, pageSchemeHint, readPageScheme } from "../../../packages/ui/src/inspector/scheme";

beforeEach(() => {
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});

describe("page scheme", () => {
  it("reads the body background first, then html", () => {
    document.body.style.backgroundColor = "rgb(10, 10, 12)";
    expect(readPageScheme()).toBe("dark");
    document.body.style.backgroundColor = "rgb(250, 250, 250)";
    expect(readPageScheme()).toBe("light");
    document.body.style.backgroundColor = "";
    document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
    expect(readPageScheme()).toBe("dark");
  });

  it("uses the body over html when both paint", () => {
    document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
    document.body.style.backgroundColor = "rgb(255, 255, 255)";
    expect(readPageScheme()).toBe("light");
  });

  it("falls back to a class, a data attribute, then the OS when nothing is painted", () => {
    expect(pageBackground()).toBeNull();
    document.documentElement.classList.add("dark");
    expect(readPageScheme()).toBe("dark");
    document.documentElement.className = "";
    document.documentElement.setAttribute("data-theme", "dark");
    expect(pageSchemeHint()).toBe("dark");
    document.documentElement.setAttribute("data-theme", "light");
    expect(pageSchemeHint()).toBe("light");
  });

  it("an image behind the body means no solid colour is known", () => {
    document.body.style.backgroundImage = "url(a.png)";
    document.body.style.backgroundColor = "rgb(255, 255, 255)";
    expect(pageBackground()).toBeNull();
  });

  it("a translucent body background is not trusted", () => {
    document.body.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    expect(pageBackground()).toBeNull();
  });
});

describe("controls scheme", () => {
  it("is the opposite of the page unless forced", () => {
    expect(opposite("light")).toBe("dark");
    expect(controlsScheme("auto", "dark")).toBe("light");
    expect(controlsScheme("auto", "light")).toBe("dark");
    expect(controlsScheme("dark", "dark")).toBe("dark");
    expect(controlsScheme("light", "light")).toBe("light");
  });
});
