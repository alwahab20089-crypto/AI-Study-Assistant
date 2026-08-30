import { useState, useRef, useEffect } from "react";
import { getGoalMeta } from "../../constants/goalConstants.js";

const GoalCard = ({ goal, onEdit, onRemove }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const meta = getGoalMeta(goal.type);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const remaining = Math.max(0, goal.target - goal.progress);

  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 transition-all duration-300 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.1)] hover:border-violet-200">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
          <span className="text-base">🎯</span> {meta.label}
        </p>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`${meta.label} goal actions`}
            aria-expanded={menuOpen}
            className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 w-6 h-6 flex items-center justify-center rounded-md transition-colors duration-200"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-neutral-200/70 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-10 py-1.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(goal);
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-neutral-700 hover:bg-violet-50 hover:text-violet-700 transition-colors duration-150"
              >
                Edit goal
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(goal);
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
              >
                Remove goal
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-neutral-500 mt-1">
        {goal.progress} / {goal.target} {meta.unit}
      </p>

      <div
        role="progressbar"
        aria-valuenow={goal.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${meta.label}: ${goal.progress} of ${goal.target} ${meta.unit} completed, ${goal.percentage} percent.`}
        className="w-full h-2.5 bg-neutral-100 rounded-full mt-3 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            goal.completed
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-violet-600 to-indigo-500"
          }`}
          style={{ width: `${goal.percentage}%` }}
        />
      </div>

      <p className="text-xs text-neutral-400 mt-2">
        {goal.completed ? (
          <span className="text-emerald-600 font-medium">✓ Goal completed</span>
        ) : (
          `${remaining} ${meta.unit} remaining`
        )}
      </p>
    </div>
  );
};

export default GoalCard;