/**
 * @author EmmanuelOlaojo
 * @since 8/13/16
 */

module.exports = describe("Roller", function(){
  after(require("./cleanup"));

  describe("#roll", function(){
    it("should throw original error on failure", function(){
      task.save(TestMdlA, {name: "BoJack Horseman", age: 34})
        .save(TestMdlB, {name: "Puss in Boots", age: 26})
        .update(TestMdlA, {name: "BoJack Horseman"}, {name: "Samurai Jack", age: 300})
        .update(TEST_COLLECTION_B, {name: "Puss in Boots"}, {name: "Aristocat", age: 6})
        .save(TEST_COLLECTION_A, {_id: ["fail"]});

      return expect(task.run({ useMongoose: false }))
        .to.eventually.be
        .rejectedWith(/can\'t use an array for _id/);
    });

    it("should rollback save", function(){
      return task.save(TestMdlA, {name: "Arya Stark", age: 34})
        .save(TestMdlA, {_id: ["fail"]})
        .run({ useMongoose: false })
        .then(ensureFailure)
        .catch(function(){
          return expect(TestMdlA.find({name: "Arya Stark"}).exec())
            .to.eventually.have.length(0);
        });
    });

    it("should rollback update", async function(){
      await dbUtils.dropCollection(TEST_COLLECTION_A);

      return task.save(TestMdlA, {name: "Tyrion Lannister", age: 34})
        .run()
        .then(function(result){
          // Tyrion's id
          const id = result[0]._id;

          return task
            .update(TestMdlA, {_id: id}, { $inc: { age: 1 } })
            .save(TestMdlA, { _id: [id] })
            .run({ useMongoose: false })
            .then(ensureFailure)
            .catch(function(err){
              return expect(TestMdlA.find({name: "Tyrion Lannister", age: 34}).exec()).to.eventually.have.length(1);
            });
        })
    });

    it("should rollback remove", function(){
      return task.remove(TestMdlA, {name: "Tyrion Lannister"})
        .save(TestMdlA, {_id: ["fail"]})
        .run({ useMongoose: false })
        .then(ensureFailure)
        .catch(function(){
          return expect(TestMdlA.find({name: "Tyrion Lannister"}).exec()).to.eventually.have.length(1);
        });
    });

    it("should rollback save, update and remove with mongoose", function(){
      var dog1 = new TestMdlC({name: "dog1", age: 2});
      var dog2 = new TestMdlC({name: "dog2", age: 3});
      var dog2b = {_id: dog2._id, name: dog2.name, age: 5};
      var dog3 = new TestMdlC({age: 4});

      return task.save(dog1)
        .save(dog2)
        .remove(dog1)
        .update(dog2, dog2b)
        .options({viaSave: true})
        .save(dog3)
        .run()
        .then(ensureFailure)
        .catch(function(){
          return expect(TestMdlC.find().exec()).to.eventually.have.length(0);
        });
    });
  });
});

function ensureFailure() {
  // TestMdlA.find().exec(console.log);
  throw new Error("failed");
}
