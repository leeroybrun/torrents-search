const XRegExp = require('xregexp');

exports.regex = (value, regexStr, fieldName) => {
  let result = null;
  const regex = XRegExp(regexStr, 'ig');

  let matches = XRegExp.exec(value, regex);
  if(matches !== null && fieldName in matches && matches[fieldName]) {
    result = matches[fieldName].trim();
  }

  return result;
}

exports.until = (value, str) => {
  return typeof value === 'string' && value.indexOf(str) > 0 ? value.substr(0, value.indexOf(str)) : value;
}

exports.since = (value, str) => {
  return typeof value === 'string' && value.indexOf(str) > 0 ? value.substr(value.indexOf(str)+str.length, value.length) : value;
}

exports.trim = (value) => {
  return value.trim();
}

exports.toDate = (value) => {
  return new Date(value);
}

exports.parseSizeToBytes = (size) => {
  size = (typeof size !== 'undefined' && size !== null) ? size : '0 MB';
  var sizeA = size.split(/\s{1}/); // size split into value and unit

  var newSize = null; // size converted to MB
  switch (sizeA[1].toUpperCase()) {
    case 'B':
    case 'BYTES':
    case 'O':
        newSize = (parseInt(sizeA[0]));
        break;
    case 'KB':
    case 'KO':
        newSize = (parseInt(sizeA[0]) * 1000);
        break;
    case 'MB':
    case 'MO':
        newSize = (parseInt(sizeA[0]) * 1000 * 1000);
        break;
    case 'GB':
    case 'GO':
        newSize = (parseInt(sizeA[0]) * 1000 * 1000 * 1000);
        break;
    case 'TB':
    case 'TO':
        newSize = (parseInt(sizeA[0]) * 1000 * 1000 * 1000 * 1000);
        break;
    default:
        return size;
  }

  return newSize;
};