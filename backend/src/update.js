'use strict';

const aws = require('aws-sdk');
const shortid = require('shortid');
const bcrypt = require('bcryptjs');

const ddb = new aws.DynamoDB.DocumentClient();

module.exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  const body = JSON.parse(event.body);

  const queryParams = {
    TableName: process.env.LINK_TABLE,
    IndexName: 'ByLocation',
    KeyConditionExpression: '#hkey = :hkey',
    ExpressionAttributeNames: {
      '#hkey': 'location'
    },
    ExpressionAttributeValues: {
      ':hkey': body.location,
    }
  };

  console.log(queryParams);

  try {
    const existing = await ddb.query(queryParams).promise();

    console.log(existing);

    if (existing.Items.length > 0) {
      const item = existing.Items[0];

      if (body.key && body.password) {
        console.log('changing key');

        console.log(item);

        if (item.passwordHash) {
          console.log('checking if password matches');
          var match = await bcrypt.compare(body.password, item.passwordHash);
          
          if (!match) {
            return {
              statusCode: 403,
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
              body: 'Password incorrect'
            }
          }

          console.log('match');

          const deleteParams = {
            TableName: process.env.LINK_TABLE,
            Key: {
              Key: item.Key
            }
          }

          await ddb.delete(deleteParams).promise();

          const writeParams = {
            TableName: process.env.LINK_TABLE,
            Item: {
              Key: body.key,
              passwordHash: item.passwordHash,
              location: item.location,
            }
          };

          try {
            await ddb.put(writeParams).promise();

            return {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                key: body.key
              })
            };
          } catch (e) {
            return {
              statusCode: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
            };
          }
        } else {
          const passwordHash = await bcrypt.hash(body.password, 10);

          const writeParams = {
            TableName: process.env.LINK_TABLE,
            Item: {
              Key: body.key,
              passwordHash: passwordHash,
              location: item.location,
            }
          };

          try {
            await ddb.put(writeParams).promise();

            return {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                key: body.key
              })
            };
          } catch (e) {
            return {
              statusCode: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
            };
          }
        }
      } else {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: item.Key
          })
        };
      }
    } else {

      if (body.password && body.key) {
        const passwordHash = await bcrypt.hash(body.password, 10);

        const createParams = {
          TableName: process.env.LINK_TABLE,
          Item: {
            Key: body.key,
            location: body.location,
            passwordHash: passwordHash,
          }
        }
    
        try {
          await ddb.put(createParams).promise();
    
          return {
            statusCode: 201,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: body.key
            })
          };
        } catch (e) {
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
          };
        }
      } else {
        const key = shortid.generate();

        const createParams = {
          TableName: process.env.LINK_TABLE,
          Item: {
            Key: key,
            location: body.location
          }
        }
    
        try {
          await ddb.put(createParams).promise();
    
          return {
            statusCode: 201,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: key
            })
          };
        } catch (e) {
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
          };
        }
      }
    }
  } catch (e) {
    console.log(e);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
    };
  }
};
