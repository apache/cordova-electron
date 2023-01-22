class PluginResult {
  static STATUS_OK = 'OK'
  static STATUS_ERROR = 'ERROR'
  static ERROR_UNKNOWN_SERVICE = 'ERR_UNKNOWN_SERVICE'
  static ERROR_UNKNOWN_ACTION = 'ERR_UNKNOWN_ACTION'
  static ERROR_UNEXPECTED_RESULT = 'ERR_UNEXPECTED_RESULT'
  static ERROR_INVOCATION_EXCEPTION_NODE = 'ERROR_INVOCATION_EXCEPTION_NODE'
  static ERROR_INVOCATION_EXCEPTION_CHROME = 'ERROR_INVOCATION_EXCEPTION_CHROME'
  keepCallback = false;

  constructor(status, data) {
    this.status = status;
    this.data = data !== undefined ? data : null;
  }

  setKeepCallback(value) {
    this.keepCallback = value;
  }
}

class CallbackContext {

  constructor(contextId, window) {
    this.contextId = contextId;
    this.window = window;
    // add PluginResult as instance variable to be able to access it in plugins
    this.PluginResult = PluginResult;
  }
  sendPluginResult(result) {
    this.window.webContents.send(this.contextId, result)
  }
  success(data) {
    this.sendPluginResult(new PluginResult(PluginResult.STATUS_OK, data))
  }
  error(data) {
    this.sendPluginResult(new PluginResult(PluginResult.STATUS_ERROR, data))
  }
}

module.exports = { CallbackContext, PluginResult };