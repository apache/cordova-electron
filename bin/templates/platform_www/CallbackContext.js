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
PluginResult.prototype.STATUS_OK = 'OK';
PluginResult.prototype.STATUS_ERROR = 'ERROR';
PluginResult.prototype.ERROR_UNKNOWN_SERVICE = 'ERR_UNKNOWN_SERVICE';
PluginResult.prototype.ERROR_UNKNOWN_ACTION = 'ERR_UNKNOWN_ACTION';
PluginResult.prototype.ERROR_UNEXPECTED_RESULT = 'ERR_UNEXPECTED_RESULT';
PluginResult.prototype.ERROR_INVOCATION_EXCEPTION_NODE = 'ERROR_INVOCATION_EXCEPTION_NODE';
PluginResult.prototype.ERROR_INVOCATION_EXCEPTION_CHROME = 'ERROR_INVOCATION_EXCEPTION_CHROME';

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
