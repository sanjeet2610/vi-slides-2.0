import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    text: "",
    isAnonymous: false,
  });
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchMyQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const { data } = await axios.get(`${API}/api/questions/my`, authHeaders);
      setQuestions(data.questions || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to fetch questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyQuestions();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!form.text.trim()) {
      alert("Please enter a question.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${API}/api/questions`,
        {
          text: form.text.trim(),
          isAnonymous: form.isAnonymous,
        },
        authHeaders
      );

      setForm({ text: "", isAnonymous: false });

      if (data?.question) {
        setQuestions((prev) => [data.question, ...prev]);
      } else {
        fetchMyQuestions();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.name || "Student"}!</p>
      <button onClick={logout}>Logout</button>

      <hr />

      <h2>Submit a Question</h2>
      <form onSubmit={handleSubmitQuestion}>
        <textarea
          name="text"
          placeholder="Type your question..."
          value={form.text}
          onChange={handleChange}
          rows={4}
          required
        />
        <div>
          <label>
            <input
              type="checkbox"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
            />
            Ask anonymously
          </label>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Question"}
        </button>
      </form>

      <hr />

      <h2>My Questions</h2>
      {loadingQuestions ? (
        <p>Loading...</p>
      ) : questions.length === 0 ? (
        <p>No questions submitted yet.</p>
      ) : (
        <ul>
          {questions.map((q) => (
            <li key={q._id} style={{ marginBottom: "16px" }}>
              <p>
                <strong>Question:</strong> {q.text}
              </p>
              <p>
                <strong>Status:</strong> {q.status}
              </p>
              <p>
                <strong>Answer:</strong> {q.answer ? q.answer : "Not answered yet"}
              </p>
              <small>
                {new Date(q.createdAt).toLocaleString()} {q.isAnonymous ? "| Anonymous" : ""}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}