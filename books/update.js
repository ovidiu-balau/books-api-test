"use strict";

const dynamodb = require("./dynamodb");
const Joi = require("@hapi/joi");

const bookModel = Joi.object({
  name: Joi.string(),
  releaseDate: Joi.date().timestamp("unix"),
  authorName: Joi.string()
});

module.exports.update = (event, context, callback) => {
  const data = JSON.parse(event.body);
  const { error, value } = bookModel.validate(data);
  if (error) {
    callback(null, {
      headers: { "Content-Type": "text/plain" },
      body: error.details
    });
  } else {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        uuid: event.pathParameters.uuid
      },
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": value.name,
        ":releaseDate": new Date(value.releaseDate).getTime() / 1000,
        ":authorName": value.authorName
      },
      UpdateExpression:
        "SET #name = :name, releaseDate = :releaseDate, authorName = :authorName",
      ReturnValues: "ALL_NEW"
    };

    dynamodb.update(params, (error, result) => {
      if (error) {
        console.error(error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Content-Type": "text/plain" },
          body: "Couldn't update the book."
        });
        return;
      }

      // create a response
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Attributes)
      };
      callback(null, response);
    });
  }
};
