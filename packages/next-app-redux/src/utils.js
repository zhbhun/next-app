/**
 * @param {Object|Function} models
 * @param {Object} router Next 路由信息
 */
export const createModels = (models = {}, router) => {
  const modelkey =
    router && router.query && router.query._ ? router.query._ : '0';
  if (typeof models === 'function') {
    return models(modelkey, router);
  }
  return Object.keys(models || {}).reduce((rcc, key) => {
    const Model = models[key];
    const model = typeof Model === 'function' ? new Model(modelkey) : Model;
    rcc[key] = model;
    return rcc;
  }, {});
};

export default { createModels };
