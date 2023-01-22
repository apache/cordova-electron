module.exports = {
  testLocation() {
    return window.location;
  },
  testEchoBrowser(args) {
    return "BROWSER: echo1 is: " + args[1];
  }
}