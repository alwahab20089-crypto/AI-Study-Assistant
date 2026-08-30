const StatCard = ({ label, value }) => {
  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(109,40,217,0.15)] hover:border-violet-200">
      <div className="absolute top-0 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300 ease-out group-hover:w-full" />
      <p className="text-sm text-neutral-500 tracking-wide">{label}</p>
      <p className="text-2xl font-serif font-bold text-neutral-900 mt-1.5 transition-colors duration-300 group-hover:text-violet-700">
        {value}
      </p>
    </div>
  );
};

export default StatCard;