// Fixture: prompt-12 — dirty code with heavy violations
// Intentional: raw HTML everywhere, hex colors, raw Tailwind, glyphs, inline styles, literal radius

export function ChatWindow() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-[#e5e7eb] p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">💬 Conversations</h3>
        <ul className="space-y-2">
          <li className="p-2 bg-blue-100 rounded-md cursor-pointer">
            <span className="text-sm font-medium text-blue-900">Chat with AI</span>
          </li>
          <li className="p-2 hover:bg-gray-100 rounded-md cursor-pointer">
            <span className="text-sm text-gray-700">Design discussion</span>
          </li>
        </ul>
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(100vh - 60px)" }}>
          <div className="flex justify-end">
            <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl max-w-xs">
              <p className="text-sm">What is the design system?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl max-w-xs">
              <p className="text-sm text-gray-800">It's a token-based system.</p>
            </div>
          </div>
          <div className="flex justify-center">
            <span className="text-gray-400 text-sm animate-pulse">⏳ AI is typing...</span>
          </div>
        </div>
        <div className="border-t border-gray-200 p-3 bg-white">
          <input type="text" placeholder="Type a message..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </main>
    </div>
  );
}
