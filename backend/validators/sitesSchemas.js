const Joi = require('joi');

const createSite = Joi.object({
  network_id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'network_id es requerido', 'number.base': 'network_id debe ser un número' }),
  name: Joi.string().min(1).max(150).required()  // Máximo 150 como en DB
    .messages({ 'any.required': 'name es requerido', 'string.min': 'name no puede estar vacío' }),
  description: Joi.string().max(1000).allow(null, '').optional()  // Texto largo, opcional
});

const updateSite = Joi.object({
  name: Joi.string().min(1).max(150).optional(),
  description: Joi.string().max(1000).allow(null, '').optional()
}).min(1).messages({ 'object.min': 'Nada para actualizar' });

module.exports = { createSite, updateSite };
