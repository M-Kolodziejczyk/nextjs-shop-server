"use strict";
const slugify = require("slugify");
const settings = require("./carabiner.settings.json");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (data.name) {
        data.slug = slugify(data.name);
      }
      data.collectionName = settings.collectionName;
    },
    beforeUpdate: async (params, data) => {
      if (data.name) {
        data.slug = slugify(data.name);
      }
    },
  },
};
