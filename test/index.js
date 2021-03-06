var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , voting = require('../')
  , assert = require('assert')

// Connect mongoose to mongodb
mongoose.connect('mongodb://localhost/mongoose_test_voting');

// Define User Model to work with
var User = mongoose.model('User', new Schema({
  name: String
}));

// Define Comment Schema to work with
var CommentSchema = new Schema({
  text: String,
  author: {
    type: Schema.ObjectId,
    ref: "User"
  }
});

// Extend Comment's Schema with voting plugin
CommentSchema.plugin(voting, { ref: 'User' });

// Define Comment Model to work with
var Comment = mongoose.model('Comment', CommentSchema);

describe('voting', function () {
  var author = {};
  var comment = {};

  before(function (done) {
    // Wait for mongoose to connect
    mongoose.connection.on('open', function () {
      // Also, clear database before tests
      mongoose.connection.db.dropDatabase(function (err) {
        if (err) return done(err);
        done();
      });
    });
  });

  beforeEach(function() {
    author = new User({ name: 'Cristian' });
    comment = new Comment({ text: 'Hey, this is a comment!', author: author });
  
    assert.equal(0, comment.vote.census.length);
    assert.equal(0, comment.vote.positive.length);
    assert.equal(0, comment.vote.negative.length);
  });

  describe('upvote', function() {
    it('should vote positive', function(done) {

      comment.upvote(author);
      assert.equal(1, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(0, comment.vote.negative.length);

      assert.equal(comment.vote.positive[0], comment.vote.census[0]);

      done();
    });

    it('should vote positive once', function(done) {

      comment.upvote(author);
      comment.upvote(author);
      assert.equal(1, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(0, comment.vote.negative.length);

      done();
    });

    it('should change vote from negative to positive', function(done) {
      
      comment.vote.negative.addToSet(author);
      comment.vote.census.addToSet(author);
      assert.equal(1, comment.vote.negative.length);
      assert.equal(1, comment.vote.census.length);

      comment.upvote(author);
      assert.equal(1, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(0, comment.vote.negative.length);

      done();
    });

    it('should save document when callback fn is provided', function(done) {
      // give mongo a little extra time.
      this.timeout(5000);

      comment.upvote(author, function(err, doc) {
        if (err) {
          return done(err)
        };
        
        assert.equal(doc, comment);

        done();
      });
    });

    it('should have saved positive voting', function(done) {
      // give mongo a little extra time.
      this.timeout(5000);

      comment.upvote(author, function(err, doc) {
        if (err) {
          return done(err)
        };
        
        assert.equal(1, comment.vote.positive.length);
        assert.equal(1, comment.vote.census.length);
        assert.equal(0, comment.vote.negative.length);

        done();
      });
    });


  });

  describe('downvote', function() {
    it('should vote negative', function(done) {

      comment.downvote(author);
      assert.equal(0, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(1, comment.vote.negative.length);

      assert.equal(comment.vote.negative[0], comment.vote.census[0]);

      done();
    });

    it('should vote negative once', function(done) {

      comment.downvote(author);
      comment.downvote(author);
      assert.equal(0, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(1, comment.vote.negative.length);

      done();
    });

    it('should change vote from positive to negative', function(done) {
      
      comment.vote.positive.addToSet(author);
      comment.vote.census.addToSet(author);
      assert.equal(1, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);

      comment.downvote(author);
      assert.equal(0, comment.vote.positive.length);
      assert.equal(1, comment.vote.census.length);
      assert.equal(1, comment.vote.negative.length);

      done();
    });

    it('should save document when callback fn is provided', function(done) {
      // give mongo a little extra time.
      this.timeout(5000);

      comment.downvote(author, function(err, doc) {
        if (err) {
          return done(err)
        };
        
        assert.equal(doc, comment);

        done();
      });
    });

    it('should have saved negative voting', function(done) {
      // give mongo a little extra time.
      this.timeout(5000);

      comment.downvote(author, function(err, doc) {
        if (err) {
          return done(err)
        };
        
        assert.equal(0, comment.vote.positive.length);
        assert.equal(1, comment.vote.census.length);
        assert.equal(1, comment.vote.negative.length);

        done();
      });
    });

  });

  describe('upvoted', function() {
    it('should success if voted positive', function(done) {
      comment.upvote(author);

      assert.ok(comment.upvoted(author));

      done();
    });

    it('should fail if voted negative', function(done) {
      comment.downvote(author);

      assert.equal(false, comment.upvoted(author));

      done();
    });
  });

  describe('downvoted', function() {
    it('should success if voted negative', function(done) {
      comment.downvote(author);

      assert.ok(comment.downvoted(author));

      done();
    });

    it('should fail if voted positive', function(done) {
      comment.upvote(author);

      assert.equal(false, comment.downvoted(author));

      done();
    });
  });

  after(function () {
    // Clear database after tests
    mongoose.connection.db.dropDatabase(function (err) {
      if (err) return done(err);
      done();
    });
  });

});
