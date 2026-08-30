const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-50 px-4 py-12">
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-serif font-semibold text-2xl mb-5 shadow-lg shadow-violet-300/40 ring-1 ring-white/20 transition-transform duration-300 hover:scale-105">
            N
          </div>
          <h1 className="font-serif text-xl font-semibold text-neutral-900 tracking-tight">
            NovaStudy <span className="text-violet-600">AI</span>
          </h1>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] border border-neutral-200/70 p-8 transition-shadow duration-300 hover:shadow-[0_8px_50px_-12px_rgba(109,40,217,0.15)]">
          <div className="mb-7">
            <h2 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-neutral-500 mt-2">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;