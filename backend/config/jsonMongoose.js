const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

class Schema {
  constructor(definition) {
    this.definition = definition;
    this._pres = { save: [] };
    this.methods = {};
  }

  pre(event, fn) {
    if (this._pres[event]) {
      this._pres[event].push(fn);
    }
  }
}

Schema.Types = {
  ObjectId: String
};

class QueryChain {
  constructor(data, modelClass, query = {}) {
    this.data = data;
    this.modelClass = modelClass;
    this.query = query;
  }

  select(fields) {
    if (typeof fields === 'string') {
      const isExclude = fields.startsWith('-');
      const fieldList = fields.replace('-', '').split(' ').filter(Boolean);
      this.data = this.data.map(item => {
        const newItem = { ...item };
        if (isExclude) {
          fieldList.forEach(f => delete newItem[f]);
        } else {
          Object.keys(newItem).forEach(key => {
            if (!fieldList.includes(key) && key !== '_id') delete newItem[key];
          });
        }
        return newItem;
      });
    }
    return this;
  }

  sort(sortObj) {
    if (sortObj && typeof sortObj === 'object') {
      const key = Object.keys(sortObj)[0];
      const order = sortObj[key];
      this.data.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (key === 'createdAt') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        if (valA < valB) return order === -1 ? 1 : -1;
        if (valA > valB) return order === -1 ? -1 : 1;
        return 0;
      });
    }
    return this;
  }

  lean() {
    return this;
  }

  populate(field, selectFields) {
    const referencedCollection = field === 'provider' || field === 'user' ? 'User' : null;
    if (referencedCollection) {
      const dbData = loadData(referencedCollection);
      this.data = this.data.map(item => {
        const refId = item[field];
        if (refId) {
          const refItem = dbData.find(u => u._id.toString() === refId.toString());
          if (refItem) {
            const newItem = { ...item };
            newItem[field] = { ...refItem };
            delete newItem[field].password;
            return newItem;
          }
        }
        return item;
      });
    }
    return this;
  }

  // Support thenable so it can be awaited directly
  then(onFulfilled, onRejected) {
    return Promise.resolve(this.data).then(onFulfilled, onRejected);
  }
}

const loadData = (modelName) => {
  const filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveData = (modelName, data) => {
  const filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

function createModel(modelName, schema) {
  class Model {
    constructor(data) {
      Object.assign(this, data);
      this._originalData = { ...data };
      if (!this._id) {
        this._id = generateId();
      }
      if (!this.createdAt) {
        this.createdAt = new Date().toISOString();
      }
    }

    isModified(field) {
      if (!this._originalData) return true;
      if (!this._originalData._id) return true;
      return this[field] !== this._originalData[field];
    }

    select(fields) {
      if (typeof fields === 'string') {
        const isExclude = fields.startsWith('-');
        const fieldList = fields.replace('-', '').split(' ').filter(Boolean);
        const obj = { ...this.toObject() };
        if (isExclude) {
          fieldList.forEach(f => delete obj[f]);
        } else {
          Object.keys(obj).forEach(key => {
            if (!fieldList.includes(key) && key !== '_id') delete obj[key];
          });
        }
        return obj;
      }
      return this;
    }

    async save() {
      const pres = schema._pres.save;
      for (const pre of pres) {
        await new Promise((resolve, reject) => {
          let called = false;
          const next = (err) => {
            if (called) return;
            called = true;
            if (err) reject(err);
            else resolve();
          };

          const result = pre.call(this, next);
          if (result && typeof result.then === 'function') {
            result.then(() => {
              if (!called) resolve();
            }).catch((err) => {
              if (!called) reject(err);
            });
          }
        });
      }

      const allData = loadData(modelName);
      const index = allData.findIndex(item => item._id === this._id);
      
      const savedObj = { ...this };
      Object.keys(savedObj).forEach(key => {
        if (typeof savedObj[key] === 'function') delete savedObj[key];
      });

      if (index !== -1) {
        allData[index] = savedObj;
      } else {
        allData.push(savedObj);
      }
      
      saveData(modelName, allData);
      return this;
    }

    toObject() {
      return { ...this };
    }
  }

  // Attach methods
  Object.keys(schema.methods).forEach(methodName => {
    Model.prototype[methodName] = schema.methods[methodName];
  });

  Model.findOne = async function(query) {
    const allData = loadData(modelName);
    const item = allData.find(d => {
      return Object.keys(query).every(key => {
        const val = query[key];
        if (val && typeof val === 'object') {
          if (val.$ne) {
            return d[key] !== val.$ne;
          }
        }
        return d[key] === val;
      });
    });
    if (!item) return null;
    return new Model(item);
  };

  Model.findById = async function(id) {
    if (!id) return null;
    const allData = loadData(modelName);
    const item = allData.find(d => d._id.toString() === id.toString());
    if (!item) return null;
    return new Model(item);
  };

  Model.create = async function(data) {
    const inst = new Model(data);
    await inst.save();
    return inst;
  };

  Model.find = function(query = {}) {
    const allData = loadData(modelName);
    const filtered = allData.filter(d => {
      return Object.keys(query).every(key => {
        const val = query[key];
        if (val && typeof val === 'object') {
          if (val.$regex) {
            const regex = new RegExp(val.$regex, val.$options || '');
            return regex.test(d[key] || '');
          }
          if (val.$elemMatch) {
            const elemQuery = val.$elemMatch;
            const array = d[key] || [];
            return array.some(el => {
              if (elemQuery.$regex) {
                const regex = new RegExp(elemQuery.$regex, elemQuery.$options || '');
                return regex.test(el || '');
              }
              return el === elemQuery;
            });
          }
        }
        return d[key] === val;
      });
    });
    return new QueryChain(filtered, Model, query);
  };

  Model.countDocuments = async function(query = {}) {
    const allData = loadData(modelName);
    const filtered = allData.filter(d => {
      return Object.keys(query).every(key => d[key] === query[key]);
    });
    return filtered.length;
  };

  Model.updateMany = async function(query, update) {
    const allData = loadData(modelName);
    let count = 0;
    const updated = allData.map(d => {
      const match = Object.keys(query).every(key => d[key] === query[key]);
      if (match) {
        count++;
        return { ...d, ...update };
      }
      return d;
    });
    saveData(modelName, updated);
    return { modifiedCount: count };
  };

  Model.findByIdAndUpdate = async function(id, update) {
    const allData = loadData(modelName);
    const index = allData.findIndex(d => d._id.toString() === id.toString());
    if (index !== -1) {
      allData[index] = { ...allData[index], ...update };
      saveData(modelName, allData);
      return new Model(allData[index]);
    }
    return null;
  };

  return Model;
}

module.exports = {
  Schema,
  model: createModel,
  Types: {
    ObjectId: String
  }
};
