'use strict';

const aws = require('aws-sdk');

const ddb = new aws.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));
  const key = event.pathParameters.key;

  console.log('key', key);

  const params = {
    TableName: process.env.LINK_TABLE,
    Key: {
      Key: key,
    },
  };

  console.log(params);

  try {
    const result = await ddb.get(params).promise();

    console.log(result);

    return {
      statusCode: 307,
      headers: {
        Location: result.Item.location,
      },
    };
  } catch(e) {
    console.log(e);
    return {
      statusCode: 404,
    };
  }
};
