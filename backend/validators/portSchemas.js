const Joi = require('joi');

const createPort = Joi.object({
  device_id: Joi.number().integer().required(),
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('Fast Ethernet', 'Gigabit Ethernet', 'Serial', 'Console').required(),
  status: Joi.string().valid('available', 'used').default('available')
});

const updatePort = Joi.object({
  name: Joi.string().max(100),
  type: Joi.string().valid('Fast Ethernet', 'Gigabit Ethernet', 'Serial', 'Console'),
  status: Joi.string().valid('available', 'used')
});

module.exports = { createPort, updatePort };
