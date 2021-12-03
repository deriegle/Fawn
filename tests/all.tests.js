/**
 * @author EmmanuelOlaojo
 * @since 6/22/16
 */

var fs = require("fs");

const config = require("../test_conf");
config.init();

var Fawn = config.Fawn;
var DB = config.DB;
var TASKS = config.TASKS;

global.mongoose = require("mongoose");

global.dbUtils = require("../lib/utils/db.utils")(mongoose);
global.utils = require("../lib/utils/gen.utils");
global.expect = config.expect;
global.Promise = config.Promise;
global.TEST_COLLECTION_A = config.TEST_COLLECTION_A;
global.TEST_COLLECTION_B = config.TEST_COLLECTION_B;
global.TEST_COLLECTION_C = config.TEST_COLLECTION_C;

describe("ALL TESTS", function(){
  before(function(){
    Fawn.init(config.db + DB, TASKS);

    global.Task = Fawn.Task;
    global.task = Fawn.Task();
    global.taskMdl = task.getTaskCollection();

    global.TestMdlA = dbUtils.getModel(TEST_COLLECTION_A);
    global.TestMdlB = dbUtils.getModel(TEST_COLLECTION_B);
    global.TestMdlC = dbUtils.getModel(TEST_COLLECTION_C, {
      name: { type: String, required: true },
      age: Number,
    });
  });

  after(function(){
    return dbUtils.dropCollection(TASKS);
  });

  require("./task.tests");
  require("./roller.tests");
});


