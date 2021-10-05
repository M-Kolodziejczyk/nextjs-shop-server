"use strict";
const stripe = require("stripe")(process.env.STRIPE_TEST);

const modelNames = require("../../modelNames.json");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

async function updateProducts(products) {
  let amount = 0;
  let availableProducts = [];

  for (const product of products) {
    const modelName = modelNames[product.__typename];
    const item = await strapi.query(modelName).findOne({ id: product._id });

    if (item.inventory_available > 0) {
      const update = await strapi.query(modelName).update(
        { id: product._id },
        {
          inventory_available: item.inventory_available - 1,
        }
      );

      amount += update.price;
      availableProducts.push({
        name: update.name,
        brand: update.brand,
        collectionName: update.collectionName,
        description: update.description,
        id: update.id,
        price: update.price,
        slug: update.slug,
      });
    }
  }

  return {
    amount,
    availableProducts,
  };
}

module.exports = {
  async create(ctx) {
    const { email, name, address, city, products } = JSON.parse(
      ctx.request.body
    );

    const { amount, availableProducts } = await updateProducts(products);

    if (availableProducts.length > 0) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
      });

      const entity = await strapi.services.order.create({
        email: email,
        name,
        address,
        city,
        amount: amount,
        products: availableProducts,
        status: "NEW",
      });

      entity.clientSecret = paymentIntent.client_secret;
      entity.availableProducts = availableProducts;

      return entity;
    } else {
      return null;
    }
  },

  async update(ctx) {
    const { id } = ctx.params;

    try {
      const payment = await stripe.paymentIntents.retrieve(
        ctx.request.body.paymentId
      );

      if (payment.status === "succeeded") {
        const entity = await strapi.services.order.update(
          { id },
          { status: "SUCCEEDED" }
        );

        return entity;
      } else {
        const entity = await strapi.services.orders.update(
          { id },
          { status: "FAIL" }
        );

        return entity;
      }
    } catch (error) {
      console.log("ERROR: ", error);
      return error;
    }
  },

  async userOrder(ctx) {
    const email = ctx.request.body.email;

    const entity = await strapi.services.order.find({
      email: email,
    });

    return entity;
  },
};
