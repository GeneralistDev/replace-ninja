'use strict';

const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

const path = require('path');

let indexHtml = null;

module.exports.handler = async (event, context) => {
  console.log('start');
  if (!indexHtml) {
    console.log('notfound');
    console.log(path.resolve('./src/index.html'));
    try {
      const data = await readFile(path.resolve('./src/index.html'));

      console.log('file loaded');

      console.log(data);

      indexHtml = data.toString();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
        },
        body: indexHtml,
      };
    } catch (err) {
      console.log(err);

      return {
        statusCode: 500,
        body: JSON.stringify(err)
      };
    }
  } else {
    console.log('found cached version');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
      },
      body: indexHtml,
    };
  }
};
