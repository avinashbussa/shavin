// Fixture: prompt-7 — dirty code with multiple violation types
// Intentional: raw HTML, hex color, raw Tailwind color, literal radius, glyph

import { TextField, Select, Switch, Button, Card } from "@shavin/ui";

export function SearchFilterBar() {
  return (
    <Card padding="3">
      <div className="flex gap-3 items-center bg-gray-100 rounded-md p-3">
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm"
        />
        <select className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
          <option>All Categories</option>
          <option>Electronics</option>
          <option>Clothing</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">⚙ In Stock</span>
          <Switch />
        </div>
        <button className="px-3 py-2 text-sm text-red-500 hover:text-red-600">
          ✕ Reset
        </button>
      </div>
    </Card>
  );
}
