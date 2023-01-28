const getUserByEmail = function(email, database) {
  for (const id in database) {
    const user = database[id];
    if (user.email === email) {
      return user;
    }
  }
};

module.exports = getUserByEmail;