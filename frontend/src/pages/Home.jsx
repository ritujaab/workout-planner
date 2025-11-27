import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import WeeklyPlanner from '../components/planner/WeeklyPlanner';
import WorkoutForm from '../components/workouts/WorkoutForm';
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog';
import { useWorkoutsContext } from '../hooks/useWorkoutsContext';
import { useAuthContext } from '../hooks/useAuthContext';

const getCurrentWeekDates = (date = new Date()) => {
  const sunday = new Date(date);
  const day = sunday.getDay();
  const diff = -day;
  sunday.setDate(sunday.getDate() + diff);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const Home = () => {
  const { workouts = [], dispatch } = useWorkoutsContext();
  const { user } = useAuthContext();
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [currentWeekDates, setCurrentWeekDates] = useState(getCurrentWeekDates());
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    workout: null,
    date: null,
  });

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/workouts', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load workouts');
      }

      dispatch({ type: 'SET_WORKOUTS', payload: data });
    } catch (error) {
      console.error(error);
      setFetchError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [fetchWorkouts, user]);

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_WORKOUTS', payload: [] });
    }
  }, [dispatch, user]);

  const goToPreviousWeek = () => {
    const newStartDate = new Date(currentWeekDates[0]);
    newStartDate.setDate(newStartDate.getDate() - 7);
    setCurrentWeekDates(getCurrentWeekDates(newStartDate));
  };

  const goToNextWeek = () => {
    const newStartDate = new Date(currentWeekDates[0]);
    newStartDate.setDate(newStartDate.getDate() + 7);
    setCurrentWeekDates(getCurrentWeekDates(newStartDate));
  };

  const handleToggleComplete = async (workout, date, nextState) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/workouts/${workout._id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString(),
          complete: nextState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update workout');
      }

      dispatch({ type: 'UPDATE_WORKOUT', payload: data });
      if (selectedWorkout?._id === workout._id) {
        setSelectedWorkout(data);
      }

      toast.success(nextState ? 'Workout completed!' : 'Workout marked incomplete');
      return data;
    } catch (error) {
      toast.error(error.message || 'Unable to update workout');
      throw error;
    }
  };

  const handleDeleteClick = (workout, date) => {
    setDeleteDialog({
      isOpen: true,
      workout,
      date,
    });
  };

  const handleDeleteConfirm = async (action) => {
    const { workout, date } = deleteDialog;
    
    try {
      if (action === 'this') {
        await handleDeleteWorkout(workout, date, 'this');
        toast.success('Workout skipped for this day');
      } else if (action === 'all') {
        await handleDeleteWorkout(workout, date, 'all');
        toast.success('All future occurrences removed');
      }
      // If action is 'cancel', do nothing
      setDeleteDialog({ isOpen: false, workout: null, date: null });
    } catch (error) {
      // Error is already handled in handleDeleteWorkout
      setDeleteDialog({ isOpen: false, workout: null, date: null });
    }
  };

  const handleDeleteWorkout = async (workout, date = null, action = 'this') => {
    if (!user) return;

    if (date && action === 'this') {
      // Delete this instance only (skip this day)
      try {
        const response = await fetch(`/api/workouts/${workout._id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date.toISOString(),
            skip: true,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to update workout');
        }

        dispatch({ type: 'UPDATE_WORKOUT', payload: data });
        if (selectedWorkout?._id === workout._id) {
          setSelectedWorkout(data);
        }

        return data;
      } catch (error) {
        toast.error(error.message || 'Unable to update workout');
        throw error;
      }
    } else if (date && action === 'all') {
      // Delete all future occurrences (set endDate to day before)
      try {
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() - 1);
        
        const response = await fetch(`/api/workouts/${workout._id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endDate: endDate.toISOString(),
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to update workout');
        }

        dispatch({ type: 'UPDATE_WORKOUT', payload: data });
        if (selectedWorkout?._id === workout._id) {
          setSelectedWorkout(data);
        }

        return data;
      } catch (error) {
        toast.error(error.message || 'Unable to update workout');
        throw error;
      }
    } else {
      // Delete entire series
      try {
        const response = await fetch(`/api/workouts/${workout._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to delete workout');
        }

        dispatch({ type: 'DELETE_WORKOUT', payload: data });
        if (selectedWorkout?._id === workout._id) {
          setSelectedWorkout(null);
        }

        toast.success('Workout series deleted');
        return data;
      } catch (error) {
        toast.error(error.message || 'Unable to delete workout');
        throw error;
      }
    }
  };

  return (
    <div
      style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          margin: "0",
          padding: "2rem",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "2rem",
        }}
      >
        <section
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <header
            style={{
              marginBottom: "2.5rem",
            }}
          >
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "2rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Plan your training week
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                Assign workouts to days, track completion, and stay consistent.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                padding: "1rem",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                onClick={goToPreviousWeek}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "12px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#475569",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#667eea";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                }}
              >
                ← Previous
              </button>

              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  padding: "0.6rem 1.5rem",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  borderRadius: "12px",
                  minWidth: "200px",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                }}
              >
                {currentWeekDates[0].toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {" - "}
                {currentWeekDates[6].toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <button
                onClick={goToNextWeek}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "12px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#475569",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#667eea";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                }}
              >
                Next →
              </button>
            </div>
          </header>

          {fetchError && (
            <div
              style={{
                marginBottom: "1.5rem",
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                borderLeft: "4px solid #ef4444",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                color: "#991b1b",
                fontWeight: 500,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
              }}
            >
              {fetchError}
            </div>
          )}

          <WeeklyPlanner
            workouts={workouts}
            currentWeekDates={currentWeekDates}
            selectedWorkoutId={selectedWorkout?._id}
            onSelectWorkout={setSelectedWorkout}
            onDeleteClick={handleDeleteClick}
            onToggleComplete={handleToggleComplete}
            isLoading={isLoading}
          />
        </section>

        <aside
          style={{
            position: "sticky",
            top: "2rem",
            height: "fit-content",
          }}
        >
          <WorkoutForm
            selectedWorkout={selectedWorkout}
            setSelectedWorkout={setSelectedWorkout}
          />
        </aside>
      </div>
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, workout: null, date: null })}
        onConfirm={handleDeleteConfirm}
        workoutTitle={deleteDialog.workout?.title}
        date={deleteDialog.date}
      />
    </div>
  );
};

export default Home;