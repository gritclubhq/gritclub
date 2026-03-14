'use client'

interface SignOutModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function SignOutModal({ isOpen, onConfirm, onCancel }: SignOutModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-[#1E293B] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Sign out?</h2>
            <p className="text-slate-400 text-sm mt-1">
              You'll need to sign back in to access your dashboard.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 
                         hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 
                         text-white transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
