const date = {
  getDate: function () {
    const today = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  },
};

// module.exports= date;
export default date;
