import { useMemo } from 'react';
import toast from 'react-hot-toast';

import { DAYS } from '../../constants/days';
import DayColumn from './DayColumn';
import Loader from '../common/Loader';

const WeeklyPlanner = ({
  workouts = [],
  selectedWorkoutId,
  currentWeekDates = [],
  onSelectWorkout,
  onDeleteClick = () => {},
  onToggleComplete = async () => {},
  isLoading,
}) => {

  const workoutsByDate = useMemo(() => {
    const groups = {};

    // Initialize date groups
    currentWeekDates.forEach(date => {
      const dateStr = date.toISOString().slice(0, 10);
      groups[dateStr] = [];
    });

    // Assign workouts into their corresponding days
    workouts.forEach(workout => {
      const completionDates = Array.isArray(workout.completionDates)
        ? workout.completionDates
        : null;

      const skippedDates = Array.isArray(workout.skippedDates)
        ? workout.skippedDates
        : null;

      workout.hasInvalidDates = !completionDates || !skippedDates;

      currentWeekDates.forEach(date => {
        const dateStr = date.toISOString().slice(0, 10);
        const dayIndex = date.getDay();
        const dayName = DAYS[dayIndex];

        const addedDate = workout.addedDate
          ? new Date(workout.addedDate)
          : new Date(0);

        const endDate = workout.endDate
          ? new Date(workout.endDate)
          : null;

        const dateInSkipped =
          skippedDates?.some(d => new Date(d).toISOString().slice(0, 10) === dateStr) || false;

        if (
          workout.dayOfWeek === dayName &&
          date >= addedDate &&
          (!endDate || date <= endDate) &&
          !dateInSkipped
        ) {
          groups[dateStr].push(workout);
        }
      });
    });

    // Sort workouts for each day by creation date
    Object.keys(groups).forEach(key => {
      groups[key].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    });

    return groups;
  }, [workouts, currentWeekDates]);


  const handleToggleComplete = async (workout, date, nextState) => {
    try {
      await onToggleComplete(workout, date, nextState);
      toast.success(
        nextState ? 'Workout completed!' : 'Workout marked incomplete'
      );
    } catch (error) {
      toast.error(error.message || 'Unable to update workout');
    }
  };

  if (isLoading) {
    return (
      <div className="weekly-planner__loading">
        <Loader label="Loading your workouts..." />
      </div>
    );
  }

  return (
    <div className="weekly-planner">
      {currentWeekDates.map(date => {
        const dateStr = date.toISOString().slice(0, 10);

        return (
          <DayColumn
            key={dateStr}
            date={date}
            workouts={workoutsByDate[dateStr]}
            onEdit={onSelectWorkout}
            onDelete={workout => onDeleteClick(workout, date)}
            onToggleComplete={(workout, nextState) =>
              handleToggleComplete(workout, date, nextState)
            }
            selectedWorkoutId={selectedWorkoutId}
          />
        );
      })}
    </div>
  );
};

export default WeeklyPlanner;
