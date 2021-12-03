const config = {
  db: "mongodb://127.0.0.1:27018/",
  DB: "OJFAWNTESTS",
  TASKS: "lints",
  Fawn: require("./lib/fawn"),
  Promise: require("bluebird"),
  TEST_COLLECTION_A: "humans",
  TEST_COLLECTION_B: "pets",
  TEST_COLLECTION_C: "animal",
  chai: require("chai"),
  init() {
    this.chai.use(require("chai-as-promised"));
    this.expect = config.chai.expect;
  },
};

module.exports = config;
