exports._fixedEncodeURIComponent = function (str) {
    var result = encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
    return result;
};