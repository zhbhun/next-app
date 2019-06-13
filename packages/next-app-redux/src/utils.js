let modelsCache = [];
const isClient = typeof window !== 'undefined';

const getModelKey = router =>
  Number(router && router.query && router.query._ ? router.query._ : '0');

const setModelsCache = (key, Component, models) => {
  if (isClient) {
    removeModelsCache(key);
    modelsCache[key] = [Component, models];
  }
};

const getModelsCache = (key, Component) => {
  if (isClient) {
    if (modelsCache[key] && modelsCache[key][0] === Component) {
      return modelsCache[key][1];
    }
  }
  return null;
};

const removeModelsCache = key => {
  if (isClient) {
    if (modelsCache.length - 1 > key) {
      modelsCache = modelsCache.slice(0, key + 1);
    }
  }
};

/**
 * @param {Object|Function} models
 * @param {Object} router Next 路由信息
 */
export const createModels = (Component, router) => {
  const models = Component.models || {};
  const modelkey = getModelKey();
  let modelsMap = isClient && getModelsCache(modelkey, Component);
  if (!modelsMap) {
    if (typeof models === 'function') {
      modelsMap = models(modelkey, router);
    } else {
      modelsMap = Object.keys(models || {}).reduce((rcc, key) => {
        const Model = models[key];
        const model = typeof Model === 'function' ? new Model(modelkey) : Model;
        rcc[key] = model;
        return rcc;
      }, {});
    }
    if (isClient) {
      setModelsCache(modelkey, Component, modelsMap);
    }
  } else {
    removeModelsCache(modelkey);
  }
  return modelsMap;
};

export default { getModelKey };
