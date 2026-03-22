const Joi = require('joi');
const { error } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const { error: err } = schema.validate(req.body, { abortEarly: false });
  if (err) {
    const errors = err.details.map((d) => d.message);
    return error(res, 'Validation failed', 422, errors);
  }
  next();
};

const schemas = {
  signup: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  connectAccount: Joi.object({
    platform: Joi.string()
      .valid('github', 'gitlab', 'leetcode', 'codeforces', 'codechef', 'hackerrank', 'geeksforgeeks', 'linkedin', 'twitter')
      .required(),
    username: Joi.string().min(1).max(100).required(),
    access_token: Joi.string().optional(),
  }),

  analyze: Joi.object({
    platforms: Joi.array()
      .items(Joi.string().valid('github', 'gitlab', 'leetcode', 'codeforces', 'codechef', 'hackerrank', 'linkedin', 'twitter'))
      .optional(),
  }),
};

module.exports = { validate, schemas };
