import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import formatDate from "../../utils/formatDate.js";

const QuizPerformanceChart = ({ history }) => {
  const data = history.map((h) => ({ date: formatDate(h.date), score: h.score }));

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a3a3a3" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#a3a3a3" }} />
            <Tooltip
              formatter={(value) => [`${value}%`, "Score"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5", fontSize: 13, boxShadow: "0 12px 32px -8px rgba(0,0,0,0.15)" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreLine)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#7c3aed" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Quiz score trend over your last {data.length} attempts, ranging from 0 to 100 percent.
      </p>
    </div>
  );
};

export default QuizPerformanceChart;