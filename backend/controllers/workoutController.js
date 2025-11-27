const mongoose = require('mongoose');
const Workout = require('../models/workoutModel');

const VALID_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const ensureObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDayOfWeek = (value) => {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return VALID_DAYS.find((day) => day.toLowerCase() === normalized) || null;
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // normalize to start of day UTC to avoid dupes from time part
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const toResponseWorkout = (doc) => {
  const workout = doc.toObject();
  workout.dayOfWeek = normalizeDayOfWeek(workout.dayOfWeek) || 'Sunday';
  workout.addedDate = workout.addedDate || workout.createdAt;
  return workout;
};

// GET /api/workouts?day=Sunday&from=2025-01-01&to=2025-01-07
// For now you can keep just ?day if you want; from/to are optional.
const getWorkouts = async (req, res) => {
  try {
    const query = { user_id: req.user._id };
    const { day } = req.query;

    if (day) {
      const normalizedDay = normalizeDayOfWeek(day);
      if (!normalizedDay) {
        return res.status(400).json({ error: 'Invalid day parameter' });
      }
      query.dayOfWeek = normalizedDay;
    }

    const workouts = await Workout.find(query).sort({ createdAt: -1 });
    return res.status(200).json(workouts.map(toResponseWorkout));
  } catch (error) {
    console.error('Failed to fetch workouts', error);
    return res.status(500).json({ error: 'Unable to fetch workouts' });
  }
};

// GET /api/workouts/:id
const getWorkout = async (req, res) => {
  const { id } = req.params;
  if (!ensureObjectId(id)) {
    return res.status(400).json({ error: 'Invalid workout id' });
  }

  try {
    const workout = await Workout.findOne({
      _id: id,
      user_id: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    return res.status(200).json(toResponseWorkout(workout));
  } catch (error) {
    console.error('Failed to fetch workout', error);
    return res.status(500).json({ error: 'Unable to fetch workout' });
  }
};

// POST /api/workouts
const createWorkout = async (req, res) => {
  const { title, load, reps, dayOfWeek, notes, addedDate } = req.body;
  const emptyFields = [];
  const validationErrors = [];

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    emptyFields.push('title');
  }

  if (reps === undefined || reps === null) {
    emptyFields.push('reps');
  }

  const normalizedDay = normalizeDayOfWeek(dayOfWeek);
  if (!normalizedDay) {
    emptyFields.push('dayOfWeek');
  }

  const normalizedLoad = load !== undefined && load !== null ? normalizeNumber(load) : null;
  if (normalizedLoad !== null && normalizedLoad <= 0) {
    validationErrors.push({
      field: 'load',
      message: 'Load must be a positive number',
    });
    if (!emptyFields.includes('load')) emptyFields.push('load');
  }

  const normalizedReps = normalizeNumber(reps);
  if (normalizedReps === null || normalizedReps <= 0) {
    validationErrors.push({
      field: 'reps',
      message: 'Reps must be a positive number',
    });
    if (!emptyFields.includes('reps')) emptyFields.push('reps');
  }

  const normalizedAddedDate = addedDate ? normalizeDateOnly(addedDate) : new Date();

  if (emptyFields.length) {
    return res
      .status(400)
      .json({ error: 'Please fill in all required fields', emptyFields });
  }

  if (validationErrors.length) {
    return res
      .status(400)
      .json({ error: 'Validation failed', emptyFields, details: validationErrors });
  }

  // Check for duplicate workout (same title case-insensitive and same dayOfWeek)
  try {
    const existingWorkout = await Workout.findOne({
      user_id: req.user._id,
      dayOfWeek: normalizedDay,
      title: { $regex: new RegExp(`^${trimmedTitle}$`, 'i') },
    });

    if (existingWorkout) {
      return res.status(400).json({
        error: 'A workout with this title already exists on this day',
        emptyFields: ['title'],
      });
    }
  } catch (error) {
    console.error('Failed to check for duplicate workout', error);
    // Continue with creation if check fails
  }

  const sanitizedNotes = notes?.trim();

  try {
    const workout = await Workout.create({
      title: trimmedTitle,
      load: normalizedLoad || undefined,
      reps: normalizedReps,
      dayOfWeek: normalizedDay,
      notes: sanitizedNotes || undefined,
      addedDate: normalizedAddedDate,
      user_id: req.user._id,
      completionDates: [],
      skippedDates: [],
    });

    return res.status(201).json(toResponseWorkout(workout));
  } catch (error) {
    console.error('Failed to create workout', error);
    return res.status(500).json({ error: 'Unable to create workout' });
  }
};

// DELETE /api/workouts/:id
// This is still "delete the series entirely".
// For "delete only this day", the client will call PATCH with skip=true.
const deleteWorkout = async (req, res) => {
  const { id } = req.params;

  if (!ensureObjectId(id)) {
    return res.status(400).json({ error: 'Invalid workout id' });
  }

  try {
    const workout = await Workout.findOneAndDelete({
      _id: id,
      user_id: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    return res.status(200).json(toResponseWorkout(workout));
  } catch (error) {
    console.error('Failed to delete workout', error);
    return res.status(500).json({ error: 'Unable to delete workout' });
  }
};

// PATCH /api/workouts/:id
// Supports:
// - Updating fields (title/load/reps/dayOfWeek/notes/addedDate/endDate)
// - Per-day complete/undo via { date, complete: true/false }
// - Per-day skip/undo via { date, skip: true/false }
const updateWorkout = async (req, res) => {
  const { id } = req.params;
  if (!ensureObjectId(id)) {
    return res.status(400).json({ error: 'Invalid workout id' });
  }

  const updates = {};
  const emptyFields = [];
  const validationErrors = [];

  // Basic field updates
  if (req.body.title !== undefined) {
    const trimmedTitle = req.body.title.trim();
    if (!trimmedTitle) {
      emptyFields.push('title');
    } else {
      updates.title = trimmedTitle;
    }
  }

  if (req.body.load !== undefined) {
    if (req.body.load === null || req.body.load === '') {
      updates.load = undefined;
    } else {
      const normalizedLoad = normalizeNumber(req.body.load);
      if (normalizedLoad === null || normalizedLoad <= 0) {
        validationErrors.push({
          field: 'load',
          message: 'Load must be a positive number',
        });
        emptyFields.push('load');
      } else {
        updates.load = normalizedLoad;
      }
    }
  }

  if (req.body.reps !== undefined) {
    const normalizedReps = normalizeNumber(req.body.reps);
    if (normalizedReps === null || normalizedReps <= 0) {
      validationErrors.push({
        field: 'reps',
        message: 'Reps must be a positive number',
      });
      emptyFields.push('reps');
    } else {
      updates.reps = normalizedReps;
    }
  }

  if (req.body.dayOfWeek !== undefined) {
    const normalizedDay = normalizeDayOfWeek(req.body.dayOfWeek);
    if (!normalizedDay) {
      validationErrors.push({
        field: 'dayOfWeek',
        message: 'Day of week must be between Sunday and Saturday',
      });
      emptyFields.push('dayOfWeek');
    } else {
      updates.dayOfWeek = normalizedDay;
    }
  }

  if (req.body.notes !== undefined) {
    const cleanedNotes = req.body.notes?.trim();
    updates.notes = cleanedNotes || undefined;
  }

  if (req.body.addedDate !== undefined) {
    const d = normalizeDateOnly(req.body.addedDate);
    if (!d) {
      validationErrors.push({
        field: 'addedDate',
        message: 'addedDate must be a valid date',
      });
      emptyFields.push('addedDate');
    } else {
      updates.addedDate = d;
    }
  }

  if (req.body.endDate !== undefined) {
    const d = normalizeDateOnly(req.body.endDate);
    if (!d) {
      validationErrors.push({
        field: 'endDate',
        message: 'endDate must be a valid date',
      });
      emptyFields.push('endDate');
    } else {
      updates.endDate = d;
    }
  }

  // Per-day complete/skip handling
  const hasDateOps =
    req.body.date !== undefined &&
    (req.body.complete !== undefined || req.body.skip !== undefined);

  let normalizedDate = null;
  if (hasDateOps) {
    normalizedDate = normalizeDateOnly(req.body.date);
    if (!normalizedDate) {
      validationErrors.push({
        field: 'date',
        message: 'date must be a valid date string',
      });
      emptyFields.push('date');
    }
  }

  if (emptyFields.length || validationErrors.length) {
    return res
      .status(400)
      .json({ error: 'Validation failed', emptyFields, details: validationErrors });
  }

  try {
    const workout = await Workout.findOne({ _id: id, user_id: req.user._id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Check for duplicate workout if title or dayOfWeek is being updated
    const titleToCheck = updates.title || workout.title;
    const dayToCheck = updates.dayOfWeek || workout.dayOfWeek;
    
    if (updates.title !== undefined || updates.dayOfWeek !== undefined) {
      const existingWorkout = await Workout.findOne({
        user_id: req.user._id,
        _id: { $ne: id }, // Exclude current workout
        dayOfWeek: dayToCheck,
        title: { $regex: new RegExp(`^${titleToCheck.trim()}$`, 'i') },
      });

      if (existingWorkout) {
        return res.status(400).json({
          error: 'A workout with this title already exists on this day',
          emptyFields: ['title'],
        });
      }
    }

    // Apply simple updates
    Object.assign(workout, updates);

    // Apply per-day operations
    if (hasDateOps && normalizedDate) {
      const dateStr = normalizedDate.toISOString();

      // completionDates
      if (req.body.complete !== undefined) {
        const shouldComplete =
          typeof req.body.complete === 'boolean'
            ? req.body.complete
            : req.body.complete === 'true';

        const existingIndex = workout.completionDates.findIndex(
          (d) => new Date(d).toISOString() === dateStr
        );

        if (shouldComplete && existingIndex === -1) {
          workout.completionDates.push(normalizedDate);
        } else if (!shouldComplete && existingIndex !== -1) {
          workout.completionDates.splice(existingIndex, 1);
        }
      }

      // skippedDates (for "delete only this day")
      if (req.body.skip !== undefined) {
        const shouldSkip =
          typeof req.body.skip === 'boolean' ? req.body.skip : req.body.skip === 'true';

        const existingIndex = workout.skippedDates.findIndex(
          (d) => new Date(d).toISOString() === dateStr
        );

        if (shouldSkip && existingIndex === -1) {
          workout.skippedDates.push(normalizedDate);
        } else if (!shouldSkip && existingIndex !== -1) {
          workout.skippedDates.splice(existingIndex, 1);
        }
      }
    }

    const saved = await workout.save();
    return res.status(200).json(toResponseWorkout(saved));
  } catch (error) {
    console.error('Failed to update workout', error);
    return res.status(500).json({ error: 'Unable to update workout' });
  }
};

module.exports = {
  getWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  updateWorkout,
};
