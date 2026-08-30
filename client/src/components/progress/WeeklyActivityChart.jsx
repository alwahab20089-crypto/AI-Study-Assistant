import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const dayLabel = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });

const WeeklyActivityChart = ({ days }) => {
  const data = days.map((d) => ({
    day: dayLabel(d.date),
    Quizzes: d.quizzes,
    Flashcards: d.flashcards,
    "Study Sessions": d.studySessions,
  }));

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a3a3a3" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a3a3a3" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5", fontSize: 13, boxShadow: "0 12px 32px -8px rgba(0,0,0,0.15)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Quizzes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Flashcards" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Study Sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Weekly activity for the last 7 days, showing quizzes taken, flashcards reviewed, and study sessions per day.
      </p>
    </div>
  );
};

export default WeeklyActivityChart;