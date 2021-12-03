/**
 * This module dictates the structure of a
 * task.
 */
module.exports = function (mongoose, collection) {
  const Schema = mongoose.Schema;

  const taskSchema = new Schema({
    steps: [
      {
        type: {type: String, required: true},
        index: {type: Number, required: true},
        state: {type: Number, required: true},
        name: {type: String},
        condition: {},
        dataStore: [{}],
        data: {},
        options: {},
        useMongoose: Boolean,
      },
    ],
  });

  return mongoose.model(collection, taskSchema);
};
