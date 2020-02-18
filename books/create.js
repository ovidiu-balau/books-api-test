"use strict";

const uuid = require("uuid");
const dynamodb = require("./dynamodb");
const Joi = require("@hapi/joi");

const bookModel = Joi.object({
  name: Joi.string(),
  releaseDate: Joi.date().timestamp("unix"),
  authorName: Joi.string()
});

module.exports.create = (event, context, callback) => {
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
      Item: {
        uuid: uuid.v1(),
        name: value.name,
        releaseDate: new Date(value.releaseDate).getTime() / 1000,
        authorName: value.authorName
      }
    };

    dynamodb.put(params, error => {
      // handle potential errors
      if (error) {
        console.error(error);
        callback(null, {
          statusCode: error.statusCode || 501,
          headers: { "Content-Type": "text/plain" },
          body: "Couldn't create the book item."
        });
        return;
      }
      // create a response
      const response = {
        statusCode: 200,
        body: JSON.stringify(params.Item)
      };
      callback(null, response);
    });
  }
};
