import EmptyState from '../common/EmptyState';
import WorkoutCard from '../workouts/WorkoutCard';

const DayColumn = ({
  date,
  workouts,
  onEdit,
  onDelete,
  onToggleComplete,
  selectedWorkoutId,
}) => {
  const dateStr = date.toISOString().slice(0, 10);

  const completedCount = workouts.filter(workout =>
    (workout.completionDates || []).some(d => new Date(d).toISOString().slice(0, 10) === dateStr)
  ).length;

  const countLabel = workouts.length ? `${completedCount}/${workouts.length} done` : '0 planned';

  return (
    <section className="day-column">
      <header className="day-column__header">
        <h3>
          {date.toLocaleDateString(undefined, { weekday: 'short' })} <br />
          <small>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
        </h3>
        <span className="day-column__count">{countLabel}</span>
      </header>

      <div className="day-column__body">
        {workouts.length === 0 ? (
          <EmptyState
            title={`No workouts yet for ${date.toLocaleDateString(undefined, { weekday: 'long' })}`}
            description="Add a workout to stay consistent."
          />
        ) : (
          workouts.map(workout => {
            const isCompleted = (workout.completionDates || []).some(d =>
              new Date(d).toISOString().slice(0, 10) === dateStr
            );

            return (
              <WorkoutCard
                key={workout._id}
                workout={workout}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                isSelected={selectedWorkoutId === workout._id}
                completionDate={date}
                isCompleted={isCompleted}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

export default DayColumn;
