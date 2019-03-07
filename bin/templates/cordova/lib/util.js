module.exports.deepMerge = function (mergeTo, mergeWith) {
    for (const property in mergeWith) {
        if (Object.prototype.toString.call(mergeWith[property]) === '[object Object]') {
            mergeTo[property] = module.exports.deepMerge((mergeTo[property] || {}), mergeWith[property]);
        } else if (Object.prototype.toString.call(mergeWith[property]) === '[object Array]') {
            mergeTo[property] = [].concat((mergeTo[property] || []), mergeWith[property]);
        } else {
            mergeTo[property] = mergeWith[property];
        }
    }

    return mergeTo;
};
