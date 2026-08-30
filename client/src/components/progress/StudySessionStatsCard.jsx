const StudySessionStatsCard = ({ stats }) => {
  if (stats.totalSessions === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No study sessions yet. Start a Study Mode session to see your activity here.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xl font-serif font-bold text-neutral-900">{stats.totalSessions}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Sessions</p>
        </div>
        <div>
          <p className="text-xl font-serif font-bold text-emerald-600">{stats.correctAnswers}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Correct</p>
        </div>
        <div>
          <p className="text-xl font-serif font-bold text-amber-600">{stats.partialAnswers}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Partial</p>
        </div>
        <div>
          <p className="text-xl font-serif font-bold text-red-500">{stats.incorrectAnswers}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Incorrect</p>
        </div>
      </div>
      {stats.averageAccuracy !== null && (
        <p className="text-sm text-neutral-600 mt-4">Average accuracy: {stats.averageAccuracy}%</p>
      )}
    </div>
  );
};

export default StudySessionStatsCard;