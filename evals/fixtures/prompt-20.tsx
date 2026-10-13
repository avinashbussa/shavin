// Fixture: prompt-20 — dirty code with multiple violations
// Intentional: raw HTML, hex colors, raw Tailwind colors, glyph, literal radius, inline style

export function TeamInviteModal() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-1">👥 Invite Team Members</h2>
        <p className="text-sm text-gray-500 mb-4">Add people to your workspace</p>

        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@example.com"
              className="flex-1 px-3 py-2 border border-[#d1d5db] rounded-md text-sm"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option>Admin</option>
              <option>Member</option>
              <option>Viewer</option>
            </select>
            <button className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm">+</button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Custom Permissions</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-600">✓ Can view projects</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-600">✓ Can edit designs</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-600">Can delete projects</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            Send Invites
          </button>
        </div>
      </div>
    </div>
  );
}
