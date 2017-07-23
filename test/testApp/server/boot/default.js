'use strict';

module.exports = function enableAuthentication(app, next) {
  // enable authentication
  var User = app.models.User;

  var users = [
    {
      username: 'user1',
      password: 'user1',
      email: 'user1@foo.bar',
    },
    {
      username: 'user2',
      password: 'user2',
      email: 'user2@foo.bar',
    },
  ];

  // var notes = [
  //   {
  //     title: 'My note 1',
  //     content: 'Content of my note 1',
  //   },
  //   {
  //     title: 'My note 2',
  //     content: 'Content of my note 2',
  //   },
  // ];

  User.create(users).then(users => {
    // return Promise.all(users).map((user) => {
    //   return user.notes.create(notes);
    // });
    return next();
  })
  .catch(next);
};
