import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { MdDelete, MdEdit } from 'react-icons/md';

const WorkoutCard = ({
  workout,
  completionDate, // Date for this card's day
  isCompleted, // Is completed for this specific date
  onEdit,
  onDelete,
  onToggleComplete = () => {},
  isSelected,
}) => {
  const completedClass = isCompleted ? 'workout-card--completed' : '';

  return (
    <article
      className={`workout-card ${isSelected ? 'workout-card--selected' : ''} ${completedClass}`}
      onClick={() => onEdit(workout)}
    >
      <div className="workout-card__head">
        <h4>{workout.title}</h4>
        <span className="workout-card__tag">{workout.dayOfWeek}</span>
      </div>

      <div className="workout-card__metrics">
        {workout.load && (
          <span>
            Load <strong>{workout.load}kg</strong>
          </span>
        )}
        <span>
          Reps <strong>{workout.reps}</strong>
        </span>
      </div>

      {workout.notes && <p className="workout-card__notes">{workout.notes}</p>}

      <div className="workout-card__footer">
        <p className="workout-card__timestamp">
          {isCompleted
            ? `Completed on ${completionDate.toLocaleDateString()}`
            : `Updated ${formatDistanceToNow(new Date(workout.updatedAt || workout.createdAt), {
                addSuffix: true,
              })}`}
        </p>

        <div className="workout-card__actions">

          {/* Mark complete / incomplete button */}
          <button
            type="button"
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            className={`completion-toggle ${isCompleted ? 'is-complete' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleComplete(workout, !isCompleted, completionDate);
            }}
          >
            {isCompleted ? 'Completed' : 'Mark done'}
          </button>

          {!isCompleted && (
            <>
              <button
                type="button"
                aria-label="Edit workout"
                className="icon-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(workout);
                }}
              >
                <MdEdit size={18} />
              </button>

              <button
                type="button"
                aria-label="Delete workout"
                className="icon-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(workout, completionDate);
                }}
              >
                <MdDelete size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default WorkoutCard;
