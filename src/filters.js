const XRegExp = require('xregexp');

exports.regex = (size, regexStr, fieldName) => {
  let value = null;
  const regex = XRegExp(regexStr, 'ig');

  let matches = XRegExp.exec(value, regex);
  if(matches !== null && fieldName in matches && matches[fieldName]) {
    value = matches[fieldName].trim();
  }

  return value;
}

exports.until = (value, str) => {
  return typeof value === 'string' && value.indexOf(str) > 0 ? value.substr(0, value.indexOf(str)) : value;
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