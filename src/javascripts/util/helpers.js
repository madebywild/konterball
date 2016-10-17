module.exports = {
  cap: (value, cap1, cap2) => {
    if (cap1 > cap2) {
      return Math.max(cap2, Math.min(cap1, value));
    } else {
      return Math.max(cap1, Math.min(cap2, value));
    }
  }
};
