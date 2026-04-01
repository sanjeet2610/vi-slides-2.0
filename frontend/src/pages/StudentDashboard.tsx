import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Question, StoredUser } from "../types";

const API = "http://localhost:5000";

function parseStoredUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") as StoredUser | null;
  } catch {
    return null;
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = parseStoredUser();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    text: "",
    isAnonymous: false,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
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
      const { data } = await axios.get<{ questions: Question[] }>(
        `${API}/api/questions/my`,
        authHeaders
      );
      setQuestions(data.questions || []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert((err.response?.data as { message?: string })?.message || "Failed to fetch questions");
      } else {
        alert("Failed to fetch questions");
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    void fetchMyQuestions();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitQuestion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.text.trim()) {
      alert("Please enter a question.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post<{ question?: Question }>(
        `${API}/api/questions`,
        {
          text: form.text.trim(),
          isAnonymous: form.isAnonymous,
        },
        authHeaders
      );

      setForm({ text: "", isAnonymous: false });

      if (data?.question) {
        const created = data.question;
        setQuestions((prev) => [created, ...prev]);
      } else {
        void fetchMyQuestions();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert((err.response?.data as { message?: string })?.message || "Failed to submit question");
      } else {
        alert("Failed to submit question");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.name || "Student"}!</p>
      <button type="button" onClick={logout}>Logout</button>

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
