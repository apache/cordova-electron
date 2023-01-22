class PluginResult {
    constructor (status, data) {
        this.status = status;
        this.data = data !== undefined ? data : null;
        this.keepCallback = false;
    }

    setKeepCallback (value) {
        this.keepCallback = value;
    }
}
PluginResult.STATUS_OK = 1;
PluginResult.STATUS_ERROR = 2;
PluginResult.ERROR_UNKNOWN_SERVICE = 4;
PluginResult.ERROR_UNKNOWN_ACTION = 8;
PluginResult.ERROR_UNEXPECTED_RESULT = 16;
PluginResult.ERROR_INVOCATION_EXCEPTION_NODE = 32;
PluginResult.ERROR_INVOCATION_EXCEPTION_CHROME = 64;

class CallbackContext {
    constructor (contextId, window) {
        this.contextId = contextId;
        this.window = window;
        // add PluginResult as instance variable to be able to access it in plugins
        this.PluginResult = PluginResult;
    }

    sendPluginResult (result) {
        this.window.webContents.send(this.contextId, result);
    }

    success (data) {
        this.sendPluginResult(new PluginResult(PluginResult.STATUS_OK, data));
    }

    error (data) {
        this.sendPluginResult(new PluginResult(PluginResult.STATUS_ERROR, data));
    }
}

module.exports = { CallbackContext, PluginResult };
