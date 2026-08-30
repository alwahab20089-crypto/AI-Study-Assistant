import { useState, useEffect } from "react";
import { GOAL_TYPES, getGoalMeta } from "../../constants/goalConstants.js";

// mode: "create" | "edit"
// conflict: existing goal returned by the API when a duplicate goal
// already exists for today (spec section 22) — shows a replace prompt
// instead of the form.
const GoalForm = ({
  mode = "create",
  initialType = GOAL_TYPES[0].value,
  initialTarget = "",
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  conflict,
  onReplace,
  onDismissConflict,
}) => {
  const [type, setType] = useState(initialType);
  const [target, setTarget] = useState(initialTarget);
  const meta = getGoalMeta(type);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type, target: Number(target) });
  };

  if (conflict) {
    const conflictMeta = getGoalMeta(conflict.type);
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] p-6 w-full max-w-sm transition-all duration-250 ease-out ${
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
          }`}
        >
          <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-2">
            You already have a {conflictMeta.label} goal for today.
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Would you like to replace it with your new target?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onDismissConflict}
              className="flex-1 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onReplace}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 transition-all duration-200"
            >
              {isSubmitting ? "Replacing..." : "Replace goal"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] p-6 w-full max-w-sm transition-all duration-250 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-4">
          {mode === "edit" ? "Edit Study Goal" : "Set Study Goal"}
        </h3>

        <div className="mb-4">
          <label htmlFor="goal-type" className="block text-sm font-medium text-neutral-700 mb-1.5">
            Goal Type
          </label>
          <select
            id="goal-type"
            value={type}
            disabled={mode === "edit"}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {GOAL_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label htmlFor="goal-target" className="block text-sm font-medium text-neutral-700 mb-1.5">
            Target ({meta.unit})
          </label>
          <input
            id="goal-target"
            type="number"
            min={meta.min}
            max={meta.max}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
          />
          <p className="text-xs text-neutral-400 mt-1">
            {meta.verb} {target || "…"} {meta.unit} today
          </p>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 transition-all duration-200"
          >
            {isSubmitting ? "Saving..." : "Set Goal"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;