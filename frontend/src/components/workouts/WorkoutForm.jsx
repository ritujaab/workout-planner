import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { DAYS } from '../../constants/days';
import { useWorkoutsContext } from '../../hooks/useWorkoutsContext';
import { useAuthContext } from '../../hooks/useAuthContext';

const getDefaultDay = () => {
  const jsDay = new Date().getDay(); 
  return DAYS[jsDay];
};

const WorkoutForm = ({ selectedWorkout, setSelectedWorkout }) => {
  const { dispatch } = useWorkoutsContext();
  const { user } = useAuthContext();

  const [title, setTitle] = useState('');
  const [load, setLoad] = useState('');
  const [reps, setReps] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(getDefaultDay);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setLoad('');
    setReps('');
    setDayOfWeek(getDefaultDay());
    setNotes('');
    setError(null);
    setEmptyFields([]);
    setIsEditing(false);
    setEditId(null);
  }, []);

  useEffect(() => {
    if (selectedWorkout) {
      setTitle(selectedWorkout.title);
      setLoad(selectedWorkout.load);
      setReps(selectedWorkout.reps);
      setDayOfWeek(selectedWorkout.dayOfWeek || getDefaultDay());
      setNotes(selectedWorkout.notes || '');
      setEditId(selectedWorkout._id);
      setIsEditing(true);
    } else {
      resetForm();
    }
  }, [resetForm, selectedWorkout]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      load: load ? Number(load) : null,
      reps: Number(reps),
      dayOfWeek,
      notes: notes.trim(),
    };

    const url = isEditing ? `/api/workouts/${editId}` : '/api/workouts';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to save workout');
        setEmptyFields(data.emptyFields || []);
        toast.error(data.error || 'Unable to save workout');
        return;
      }

      if (isEditing) {
        dispatch({ type: 'UPDATE_WORKOUT', payload: data });
        toast.success('Workout updated');
      } else {
        dispatch({ type: 'CREATE_WORKOUT', payload: data });
        toast.success('Workout created');
      }

      resetForm();
      setSelectedWorkout(null);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setSelectedWorkout(null);
  };

  return (
    <form 
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        padding: "2rem",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
      onSubmit={handleSubmit}
    >
      <header 
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h3 
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {isEditing ? 'Edit Workout' : 'Add a New Workout'}
          </h3>
        </div>
        {isEditing && (
          <button 
            type="button" 
            onClick={handleCancel}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#64748b",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            Cancel
          </button>
        )}
      </header>

      <label 
        htmlFor="workout-title"
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontWeight: 600,
          color: "#334155",
          fontSize: "0.9rem",
        }}
      >
        Exercise title
      </label>
      <input
        id="workout-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Bench Press"
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1.25rem",
          border: emptyFields.includes('title') ? "2px solid #ef4444" : "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "0.95rem",
          outline: "none",
          transition: "all 0.2s ease",
          background: emptyFields.includes('title') ? "#fef2f2" : "#fff",
        }}
        onFocus={(e) => {
          if (!emptyFields.includes('title')) {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }
        }}
        onBlur={(e) => {
          if (!emptyFields.includes('title')) {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <label 
            htmlFor="workout-load"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#334155",
              fontSize: "0.9rem",
            }}
          >
            Load (kg) <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="workout-load"
            type="number"
            min="1"
            value={load}
            onChange={(event) => setLoad(event.target.value)}
            placeholder="Optional"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: emptyFields.includes('load') ? "2px solid #ef4444" : "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "0.95rem",
              outline: "none",
              transition: "all 0.2s ease",
              background: emptyFields.includes('load') ? "#fef2f2" : "#fff",
            }}
            onFocus={(e) => {
              if (!emptyFields.includes('load')) {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }
            }}
            onBlur={(e) => {
              if (!emptyFields.includes('load')) {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }
            }}
          />
        </div>
        <div>
          <label 
            htmlFor="workout-reps"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: "#334155",
              fontSize: "0.9rem",
            }}
          >
            Reps
          </label>
          <input
            id="workout-reps"
            type="number"
            min="1"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: emptyFields.includes('reps') ? "2px solid #ef4444" : "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "0.95rem",
              outline: "none",
              transition: "all 0.2s ease",
              background: emptyFields.includes('reps') ? "#fef2f2" : "#fff",
            }}
            onFocus={(e) => {
              if (!emptyFields.includes('reps')) {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }
            }}
            onBlur={(e) => {
              if (!emptyFields.includes('reps')) {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }
            }}
          />
        </div>
      </div>

      <label 
        htmlFor="workout-day"
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontWeight: 600,
          color: "#334155",
          fontSize: "0.9rem",
        }}
      >
        Day of week
      </label>
      <select
        id="workout-day"
        value={dayOfWeek}
        onChange={(event) => setDayOfWeek(event.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1.25rem",
          border: emptyFields.includes('dayOfWeek') ? "2px solid #ef4444" : "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "0.95rem",
          outline: "none",
          transition: "all 0.2s ease",
          background: emptyFields.includes('dayOfWeek') ? "#fef2f2" : "#fff",
          cursor: "pointer",
        }}
        onFocus={(e) => {
          if (!emptyFields.includes('dayOfWeek')) {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }
        }}
        onBlur={(e) => {
          if (!emptyFields.includes('dayOfWeek')) {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }
        }}
      >
        {DAYS.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>

      <label 
        htmlFor="workout-notes"
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontWeight: 600,
          color: "#334155",
          fontSize: "0.9rem",
        }}
      >
        Notes <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
      </label>
      <textarea
        id="workout-notes"
        rows="3"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Add reminders"
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1.5rem",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "0.95rem",
          outline: "none",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
          resize: "vertical",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#667eea";
          e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
      />

      <button 
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "100%",
          fontWeight: 700,
          fontSize: "1rem",
          padding: "0.875rem 1.5rem",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          transition: "all 0.2s ease",
          opacity: isSubmitting ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
        }}
      >
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Add Workout'}
      </button>

      {error && (
        <div 
          style={{
            marginTop: "1rem",
            padding: "0.875rem",
            background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            borderLeft: "4px solid #ef4444",
            borderRadius: "10px",
            color: "#991b1b",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
};

export default WorkoutForm;