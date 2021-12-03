"use strict";

/**
 * @author EmmanuelOlaojo
 * @since 6/15/16
 */
const Promise = require("bluebird");
const constants = require("./constants");

const cleanOptions = (options) => {
  if (typeof options !== "object") return {};

  const clean = {};
  const properties = ["db", "server", "replset", "user", "pass", "auth", "mongos", "promiseLibrary"];

  properties.forEach(function (prop) {
    if (options[prop]) clean[prop] = options[prop];
  });

  return clean;
}

const isMongoose = (obj) => 
  obj.connections instanceof Array
    && obj.connections.length >= 1
    && obj.connections[0].base
    && obj.connections[0].collections
    && obj.connections[0].models
    && obj.connections[0].config
    && obj.connections[0].otherDbs instanceof Array
    && obj.plugins instanceof Array
    && obj.models
    && (obj.Schema || obj.modelSchemas)
    && obj.options;

const getMongoose = (dbObjectOrString, options) => {
  const validTypes = ['object', 'string'];

  if (!validTypes.includes(typeof dbObjectOrString)) {
    throw new Error("Please specify a mongoose instance or a connection string")
  }

  if (typeof dbObjectOrString === 'object') {
    if (isMongoose(dbObjectOrString)) {
      return dbObjectOrString;
    }

    throw new Error("The provided mongoose instance is invalid")
  }

  const mongoose = require("mongoose");
  mongoose.connect(dbObjectOrString, options);

  mongoose.Promise = Promise;

  return mongoose;
}

class Fawn {
  static init = (db, _collection, options) => {
    const mongoose = getMongoose(db, cleanOptions(options));
    const collection = _collection || constants.DEFAULT_COLLECTION;
    const TaskMdl = require("../models/task")(mongoose, collection);

    this._Task = require("./task")(mongoose, TaskMdl);
    this._Roller = require("./roller")(mongoose, TaskMdl);
    this.dbUtils = require("./utils/db.utils")(mongoose);
  }

  static Task = () => {
    this._checkInitStatus();
    return new this._Task();
  }

  static Roller = () => {
    this._checkInitStatus();
    return this._Roller;
  }

  static initModel = (modelName, schema) => {
    this._checkInitStatus();
    dbUtils.initModel(modelName, schema);
  }


  static _checkInitStatus = () => {
    if (!(this._Roller)) {
      throw new Error("Fawn has not been initialized. Call Fawn.init");
    }
  }
}

module.exports = Fawn;
