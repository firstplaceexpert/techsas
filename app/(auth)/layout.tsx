export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#FAFCFA]">
      {/* Subtle Apple-style ambient backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Soft pale green gradients */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-pale-100/70 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-pale-200/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/60 rounded-full blur-2xl" />
        
        {/* Apple subtle micro-dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(#0F0F0F 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
