"use strict";

/**
 * @author EmmanuelOlaojo
 * @since 7/31/16
 */

var Promise = require("bluebird");

var constants = require("./constants");
var utils = require("./utils/gen.utils");

// constants
var INITIAL = constants.INITIAL;
var DONE = constants.DONE;
var ROLLED = constants.ROLLED;
var SAVE = constants.SAVE;
var UPDATE = constants.UPDATE;
var REMOVE = constants.REMOVE;

//gen utils
var updateState = utils.updateState;

// db utils
var mongoose;
var TaskMdl;
var dbUtils;
var getModel;
var getCollectionForStep;

/**
 * Initializes variables and gets the roller.
 *
 * @param _mongoose the mongoose instance
 * @param _TaskMdl the task model
 *
 * @returns An object containing rollback functions
 * @constructor
 */
var RollerProvider = function(_mongoose, _TaskMdl) {
  mongoose = _mongoose;
  TaskMdl = _TaskMdl;
  dbUtils = require("./utils/db.utils")(mongoose);
  getModel = dbUtils.getModel;
  getCollectionForStep = dbUtils.getCollectionForStep;

  return Roller;
};

var Roller = {

  /**
   * rolls back all incomplete tasks
   */
  roll: function() {
    var chain = Promise.resolve();

    return TaskMdl.find().exec().then(function (tasks) {
      tasks.forEach(function (task) {
        chain = chain.then(function () {
          return rollBackTask(task);
        });
      });
      return chain;
    });
  }

  // for internal use only
  , rollOne: rollBackTask
};

/**
 * Rollback for a single task
 *
 * @param task the task to roll back
 *
 * @returns {Promise|*}
 */
function rollBackTask(task) {
  var db = mongoose.connection.db;
  var chain = Promise.resolve();
  var lastIndex = task.steps.length - 1;
  var firstStep = task.steps[0];
  var lastStep = task.steps[lastIndex];
  var step;

  if (lastStep.state !== DONE && firstStep.state !== INITIAL) {
    for(var i = lastIndex; i >= 0 ; i--){
      step = task.steps[i];

      if (step.state === INITIAL || step.state === ROLLED) continue;

      //iife to avoid async issues
      (function(step){
        chain = chain.then(function() {
          return getRollbackFunc(step)(db, step, task);
        });
      })(step);
    }
  }

  return chain.then(function() {
    return task.deleteOne();
  });
}

/**
 * Gets the correct rollback function for a step
 *
 * @param step the step to rollback
 *
 * @returns a function to rollback step
 */
function getRollbackFunc(step) {
  switch(step.type) {
    case SAVE: return rollbackSave;
    case UPDATE:
    case REMOVE: return rollbackRemoveOrUpdate;
  }
}

/**
 * Rollback for a save step
 *
 * @param db native db
 * @param save the save step
 * @param task the task containing the step
 *
 * @returns {Promise|*}
 */
function rollbackSave(db, save, task) {
  var collection = getCollectionForStep(db, save);
  var _id = save.dataStore[0]._id;

  return collection.deleteOne({_id: _id}).then(function(){
    return updateState(task, save.index, ROLLED);
  });
}

/**
 * Rollback for remove or update step.
 *
 * @param db native db
 * @param step the update or remove step
 * @param task the task containing the step.
 *
 * @returns {Promise|*}
 */
function rollbackRemoveOrUpdate(db, step, task) {
  var collection = getCollectionForStep(db, step);
  var chain = Promise.resolve();

  step.dataStore.forEach(function(data) {
    chain = chain.then(function() {
      var condition = {_id: data._id};

      return collection.findOne(condition).then(function (doc) {
        if (doc && step.type === UPDATE) {
          return collection.updateOne(condition, { $set: data });
        }
        else if (!doc && step.type === REMOVE) {
          return collection.insertOne(data);
        }

        return Promise.resolve();
      });
    });
  });

  return chain.then(function(){
    return updateState(task, step.index, ROLLED);
  });
}

module.exports = RollerProvider;
