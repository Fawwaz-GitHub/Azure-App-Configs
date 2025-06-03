"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchToggle({view, setView}) {
  return (
    <div className="flex items-center space-x-2" onClick={() => setView(!view)}>
      <Switch id="mode" checked={view} />
      <Label htmlFor="mode">
        {view ? "Buildtime Variable" : "Runtime Variable"}
      </Label>
    </div>
  );
}
