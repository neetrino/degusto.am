const { FOOD_ATTRIBUTE_CONFIGS } = require("../data/food-attributes.cjs");

/**
 * Upsert all food attributes and return { [key]: { id, valueIds: { [slug]: id } } }.
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function upsertFoodAttributes(prisma) {
  const result = {};

  for (let attributeIndex = 0; attributeIndex < FOOD_ATTRIBUTE_CONFIGS.length; attributeIndex++) {
    const config = FOOD_ATTRIBUTE_CONFIGS[attributeIndex];
    let attribute = await prisma.attribute.findUnique({
      where: { key: config.key },
    });

    if (!attribute) {
      attribute = await prisma.attribute.create({
        data: {
          key: config.key,
          type: "select",
          filterable: true,
          position: attributeIndex + 10,
        },
      });
    } else {
      await prisma.attribute.update({
        where: { id: attribute.id },
        data: {
          filterable: true,
          position: attributeIndex + 10,
        },
      });
    }

    for (const [locale, name] of Object.entries(config.names)) {
      await prisma.attributeTranslation.upsert({
        where: {
          attributeId_locale: {
            attributeId: attribute.id,
            locale,
          },
        },
        update: { name },
        create: {
          attributeId: attribute.id,
          locale,
          name,
        },
      });
    }

    const valueIds = {};
    for (let valueIndex = 0; valueIndex < config.values.length; valueIndex++) {
      const valueConfig = config.values[valueIndex];
      let attributeValue = await prisma.attributeValue.findFirst({
        where: {
          attributeId: attribute.id,
          value: valueConfig.value,
        },
      });

      if (!attributeValue) {
        attributeValue = await prisma.attributeValue.create({
          data: {
            attributeId: attribute.id,
            value: valueConfig.value,
            position: valueIndex,
          },
        });
      } else if (attributeValue.position !== valueIndex) {
        attributeValue = await prisma.attributeValue.update({
          where: { id: attributeValue.id },
          data: { position: valueIndex },
        });
      }

      for (const [locale, label] of Object.entries(valueConfig.labels)) {
        await prisma.attributeValueTranslation.upsert({
          where: {
            attributeValueId_locale: {
              attributeValueId: attributeValue.id,
              locale,
            },
          },
          update: { label },
          create: {
            attributeValueId: attributeValue.id,
            locale,
            label,
          },
        });
      }

      valueIds[valueConfig.value] = attributeValue.id;
    }

    result[config.key] = {
      id: attribute.id,
      valueIds,
    };
  }

  return result;
}

module.exports = { upsertFoodAttributes };
