const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const workoutSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reps: {
      type: Number,
      required: true,
      min: 1,
    },
    load: {
      type: Number,
      required: false,
      min: 1,
    },
    dayOfWeek: {
      type: String,
      enum: daysOfWeek,
      required: true,
      default: 'Monday',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Recurrence + tracking
    addedDate: {
      type: Date,
      required: true,
      default: () => new Date(), // first day it should start appearing
    },
    endDate: {
      type: Date, // if set, only show on dates <= endDate
    },
    completionDates: {
      type: [Date], // list of dates (normalized) when this workout was completed
      default: [],
    },
    skippedDates: {
      type: [Date], // dates where this recurring workout is hidden (“delete only this day”)
      default: [],
    },

    user_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;
