import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/questions`, authHeaders);
      setQuestions(data.questions || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!showPendingOnly) return questions;
    return questions.filter((q) => q.status === "pending");
  }, [questions, showPendingOnly]);

  const handleDraftChange = (id, value) => {
    setAnswerDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const submitManualAnswer = async (questionId) => {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) {
      alert("Please enter an answer.");
      return;
    }

    try {
      setSubmittingId(questionId);
      await axios.patch(
        `${API}/api/questions/${questionId}/answer`,
        { answer },
        authHeaders
      );

      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      await fetchQuestions();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmittingId("");
    }
  };

  const deleteQuestion = async (questionId) => {
    const ok = window.confirm("Delete this question permanently?");
    if (!ok) return;

    try {
      setDeletingId(questionId);
      await axios.delete(`${API}/api/questions/${questionId}`, authHeaders);
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setAnswerDrafts((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete question");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {user?.name || "Teacher"}!</p>
      <button onClick={logout}>Logout</button>

      <hr />

      <label>
        <input
          type="checkbox"
          checked={showPendingOnly}
          onChange={(e) => setShowPendingOnly(e.target.checked)}
        />
        Show pending only
      </label>

      <button onClick={fetchQuestions} style={{ marginLeft: "8px" }}>
        Refresh
      </button>

      <hr />

      {loading ? (
        <p>Loading questions...</p>
      ) : filteredQuestions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <ul>
          {filteredQuestions.map((q) => {
            const canAnswer = q.status === "pending" || q.status === "answered_by_ai";

            return (
              <li key={q._id} style={{ marginBottom: "20px" }}>
                <p><strong>Question:</strong> {q.text}</p>
                <p><strong>Status:</strong> {q.status}</p>
                <p>
                  <strong>Student:</strong>{" "}
                  {q.isAnonymous ? "Anonymous" : q.studentId?.name || "Unknown"}
                </p>
                <p><strong>Current Answer:</strong> {q.answer || "Not answered yet"}</p>

                {canAnswer && (
                  <div>
                    <textarea
                      rows={3}
                      placeholder="Write manual answer..."
                      value={answerDrafts[q._id] || ""}
                      onChange={(e) => handleDraftChange(q._id, e.target.value)}
                    />
                    <br />
                    <button
                      onClick={() => submitManualAnswer(q._id)}
                      disabled={submittingId === q._id}
                    >
                      {submittingId === q._id ? "Submitting..." : "Submit Answer"}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => deleteQuestion(q._id)}
                  disabled={deletingId === q._id}
                  style={{ marginLeft: canAnswer ? "8px" : "0" }}
                >
                  {deletingId === q._id ? "Deleting..." : "Delete Question"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}