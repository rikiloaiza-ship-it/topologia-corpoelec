const Joi = require('joi');

const createConnection = Joi.object({
  network_id: Joi.number().integer().positive().required(),
  from_device_id: Joi.number().integer().positive().required(),
  to_device_id: Joi.number().integer().positive().required(),
  a_port_id: Joi.number().integer().positive().allow(null).optional(),
  b_port_id: Joi.number().integer().positive().allow(null).optional(),
  a_port_name: Joi.string().max(64).allow(null, '').optional(),
  b_port_name: Joi.string().max(64).allow(null, '').optional(),
  link_type: Joi.string().max(50).allow(null, '').optional(),
  status: Joi.string().valid('unknown', 'up', 'down').default('unknown')
}).custom((val, helpers) => {
  if (val.from_device_id === val.to_device_id) {
    return helpers.error('any.custom', {
      message: 'from_device_id y to_device_id no pueden ser iguales'
    });
  }
  return val;
}).messages({
  'any.custom': 'from_device_id y to_device_id no pueden ser iguales'
});

const updateConnection = Joi.object({
  from_device_id: Joi.number().integer().positive().optional(),
  to_device_id: Joi.number().integer().positive().optional(),
  a_port_id: Joi.number().integer().positive().allow(null).optional(),
  b_port_id: Joi.number().integer().positive().allow(null).optional(),
  a_port_name: Joi.string().max(64).allow(null, '').optional(),
  b_port_name: Joi.string().max(64).allow(null, '').optional(),
  link_type: Joi.string().max(50).allow(null, '').optional(),
  status: Joi.string().valid('unknown', 'up', 'down').optional()
}).min(1).custom((val, helpers) => {
  if (val.from_device_id && val.to_device_id && val.from_device_id === val.to_device_id) {
    return helpers.error('any.custom', {
      message: 'from_device_id y to_device_id no pueden ser iguales'
    });
  }
  return val;
}).messages({
  'object.min': 'Se requiere al menos un campo para actualizar',
  'any.custom': 'from_device_id y to_device_id no pueden ser iguales'
});

module.exports = { createConnection, updateConnection };