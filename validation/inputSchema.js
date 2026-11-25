const Joi = require("joi");

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
}).unknown(true);

const searchSchema = Joi.object({
    q: Joi.string().trim().min(2).required(),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = { 
    paginationSchema, 
    searchSchema };