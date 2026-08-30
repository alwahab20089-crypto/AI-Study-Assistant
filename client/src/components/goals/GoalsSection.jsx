import { useState, useEffect, useCallback } from "react";
import { Target } from "lucide-react";
import GoalCard from "./GoalCard.jsx";
import GoalForm from "./GoalForm.jsx";
import DeleteGoalModal from "./DeleteGoalModal.jsx";
import {
  getTodayGoalsRequest,
  createGoalRequest,
  updateGoalRequest,
  deleteGoalRequest,
} from "../../services/goalService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";

const GoalsSection = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null); // null = creating
  const [formError, setFormError] = useState("");
  const [conflict, setConflict] = useState(null); // existing goal on 409
  const [pendingSubmit, setPendingSubmit] = useState(null); // last submitted {type,target}
  const [submitting, setSubmitting] = useState(false);

  const [goalToRemove, setGoalToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getTodayGoalsRequest();
      setGoals(res.data.goals);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const openCreateForm = () => {
    setEditingGoal(null);
    setFormError("");
    setConflict(null);
    setFormOpen(true);
  };

  const openEditForm = (goal) => {
    setEditingGoal(goal);
    setFormError("");
    setConflict(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingGoal(null);
    setFormError("");
    setConflict(null);
    setPendingSubmit(null);
  };

  const handleSubmit = async ({ type, target }) => {
    setFormError("");
    setSubmitting(true);
    try {
      if (editingGoal) {
        await updateGoalRequest(editingGoal.id, target);
      } else {
        await createGoalRequest({ type, target });
      }
      await fetchGoals();
      closeForm();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.existingGoal) {
        setConflict(err.response.data.existingGoal);
        setPendingSubmit({ type, target });
      } else {
        setFormError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplace = async () => {
    if (!pendingSubmit) return;
    setSubmitting(true);
    try {
      await createGoalRequest({ ...pendingSubmit, replace: true });
      await fetchGoals();
      closeForm();
    } catch (err) {
      setConflict(null);
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!goalToRemove) return;
    setRemoving(true);
    try {
      await deleteGoalRequest(goalToRemove.id);
      await fetchGoals();
      setGoalToRemove(null);
    } catch (err) {
      setLoadError(getErrorMessage(err));
      setGoalToRemove(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
          <Target size={14} className="text-violet-600" /> Today's Study Goals
        </h2>
        {!loading && goals.length > 0 && (
          <button
            onClick={openCreateForm}
            className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors duration-200"
          >
            + Set Goal
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : loadError ? (
        <div>
          <p className="text-sm text-red-500 mb-3">Unable to load today's goals.</p>
          <button
            onClick={fetchGoals}
            className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm font-medium text-neutral-700">Set a study goal</p>
          <p className="text-sm text-neutral-500 mt-1 mb-4">
            Choose a daily target for study time, quiz questions, or flashcard
            reviews.
          </p>
          <button
            onClick={openCreateForm}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2 px-4 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            Set Today's Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEditForm}
              onRemove={setGoalToRemove}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <GoalForm
          mode={editingGoal ? "edit" : "create"}
          initialType={editingGoal?.type}
          initialTarget={editingGoal?.target ?? ""}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={submitting}
          error={formError}
          conflict={conflict}
          onReplace={handleReplace}
          onDismissConflict={closeForm}
        />
      )}

      {goalToRemove && (
        <DeleteGoalModal
          goal={goalToRemove}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setGoalToRemove(null)}
          isDeleting={removing}
        />
      )}
    </div>
  );
};

export default GoalsSection;