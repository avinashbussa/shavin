import { useState } from "react";
import { Button, Checkbox, IconButton, Link, Switch, TextField } from "@shavin/ui";

/**
 * Test fixture for the target-size suite (tests/a11y/tap-targets), route `#/__tap-fixtures`. Each control
 * carries `data-fx` so the suite can measure it alone: the hitArea overrides, the standalone Link, native
 * inputs, and a control whose own styles use ::after.
 */
export function TapFixtures() {
  const [clicks, setClicks] = useState(0);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <p data-fx="clicks">clicks: {clicks}</p>
      <div className="flex flex-wrap items-center gap-8">
        <Button size="sm" data-fx="btn-default">Default</Button>
        <Button size="sm" hitArea="none" data-fx="btn-none">None</Button>
        <Button size="sm" hitArea="touch" data-fx="btn-touch">Touch</Button>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <IconButton aria-label="Default" size="sm" data-fx="icon-default">+</IconButton>
        <IconButton aria-label="None" size="sm" hitArea="none" data-fx="icon-none">+</IconButton>
        <IconButton aria-label="Touch" size="sm" hitArea="touch" data-fx="icon-touch">+</IconButton>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <Switch aria-label="Default" size="sm" data-fx="switch-default" />
        <Switch aria-label="None" size="sm" hitArea="none" data-fx="switch-none" />
        <Switch aria-label="Touch" size="sm" hitArea="touch" data-fx="switch-touch" />
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <Checkbox aria-label="Default" data-fx="checkbox-default" />
        <Checkbox aria-label="None" hitArea="none" data-fx="checkbox-none" />
        <Checkbox aria-label="Touch" hitArea="touch" data-fx="checkbox-touch" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField aria-label="Default" size="sm" data-fx="tf-default" />
        <TextField aria-label="None" size="sm" hitArea="none" data-fx="tf-none" />
        <TextField aria-label="Touch" size="sm" hitArea="touch" data-fx="tf-touch" />
      </div>
      <div className="flex flex-wrap items-center gap-8 text-sm">
        <span>
          Read the <Link href="#/__tap-fixtures" data-fx="link-inline">inline link</Link> in this sentence.
        </span>
        <div><Link href="#/__tap-fixtures" data-fx="link-plain">Plain link</Link></div>
        <div><Link href="#/__tap-fixtures" standalone data-fx="link-standalone">Standalone link</Link></div>
        <div><Link href="#/__tap-fixtures" standalone hitArea="none" data-fx="link-standalone-none">Standalone none</Link></div>
        <div><Link href="#/__tap-fixtures" standalone hitArea="touch" data-fx="link-standalone-touch">Standalone touch</Link></div>
      </div>
      {/* A control that uses its own ::after (a status dot). hit-area reserves ::after, so it needs the opt-out. */}
      <div className="flex flex-wrap items-center gap-8">
        <Button
          size="sm"
          data-fx="clash-default"
          className="after:absolute after:right-0 after:top-0 after:h-2 after:w-2 after:rounded-full after:bg-danger after:content-['']"
          onClick={() => setClicks((n) => n + 1)}
        >
          Dot (default)
        </Button>
        <Button
          size="sm"
          hitArea="none"
          data-fx="clash-none"
          className="after:absolute after:right-0 after:top-0 after:h-2 after:w-2 after:rounded-full after:bg-danger after:content-['']"
          onClick={() => setClicks((n) => n + 1)}
        >
          Dot (hitArea none)
        </Button>
      </div>
    </div>
  );
}
