const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

class MongoDBService {
  constructor(
    uri = process.env.MONGODB_URI,
    dbName = process.env.MONGODB_NAME
  ) {
    if (!uri) {
      throw new Error("MongoDB URI is not defined");
    }
    if (!dbName) {
      throw new Error("Database name is not defined");
    }
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.db = null;
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log("Connected to MongoDB");
      return this.db;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error("MongoDB disconnection error:", error);
      throw error;
    }
  }

  // Find documents
  async find(collectionName, query = {}, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      // Process query to handle ObjectId if needed
      query = this.processObjectIds(query);

      const { limit = 0, skip = 0, sort = {}, projection = {} } = options;
      const result = await collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .project(projection)
        .toArray();

      return result;
    } catch (error) {
      console.error(`Error finding documents in ${collectionName}:`, error);
      throw error;
    }
  }

  // Find one document
  async findOne(collectionName, query = {}, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      query = this.processObjectIds(query);
      const { projection = {} } = options;
      return await collection.findOne(query, { projection });
    } catch (error) {
      console.error(`Error finding document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Insert one document
  async insertOne(collectionName, document) {
    try {
      const collection = this.db.collection(collectionName);
      const result = await collection.insertOne(document);
      return {
        acknowledged: result.acknowledged,
        insertedId: result.insertedId,
      };
    } catch (error) {
      console.error(`Error inserting document into ${collectionName}:`, error);
      throw error;
    }
  }

  // Insert many documents
  async insertMany(collectionName, documents) {
    try {
      const collection = this.db.collection(collectionName);
      const result = await collection.insertMany(documents);
      return {
        acknowledged: result.acknowledged,
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds,
      };
    } catch (error) {
      console.error(`Error inserting documents into ${collectionName}:`, error);
      throw error;
    }
  }

  // Update one document
  async updateOne(collectionName, filter, update, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      filter = this.processObjectIds(filter);
      const result = await collection.updateOne(filter, update, options);
      return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
      };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Update many documents
  async updateMany(collectionName, filter, update, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      filter = this.processObjectIds(filter);
      const result = await collection.updateMany(filter, update, options);
      return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
      };
    } catch (error) {
      console.error(`Error updating documents in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete one document
  async deleteOne(collectionName, filter) {
    try {
      const collection = this.db.collection(collectionName);
      filter = this.processObjectIds(filter);
      const result = await collection.deleteOne(filter);
      return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete many documents
  async deleteMany(collectionName, filter) {
    try {
      const collection = this.db.collection(collectionName);
      filter = this.processObjectIds(filter);
      const result = await collection.deleteMany(filter);
      return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error(`Error deleting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Run aggregation pipeline
  async aggregate(collectionName, pipeline, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      // Process pipeline stages that might contain ObjectId references
      pipeline = pipeline.map((stage) => {
        if (stage.$match) {
          stage.$match = this.processObjectIds(stage.$match);
        }
        return stage;
      });

      const result = await collection.aggregate(pipeline, options).toArray();
      return result;
    } catch (error) {
      console.error(`Error running aggregation on ${collectionName}:`, error);
      throw error;
    }
  }

  // Count documents
  async countDocuments(collectionName, query = {}, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      query = this.processObjectIds(query);
      return await collection.countDocuments(query, options);
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error);
      throw error;
    }
  }

  // List collections
  async listCollections() {
    try {
      const collections = await this.db.listCollections().toArray();
      return collections.map((collection) => collection.name);
    } catch (error) {
      console.error("Error listing collections:", error);
      throw error;
    }
  }

  // Create collection
  async createCollection(collectionName, options = {}) {
    try {
      await this.db.createCollection(collectionName, options);
      return { success: true, message: `Collection ${collectionName} created` };
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Drop collection
  async dropCollection(collectionName) {
    try {
      const result = await this.db.collection(collectionName).drop();
      return {
        success: result,
        message: `Collection ${collectionName} dropped`,
      };
    } catch (error) {
      console.error(`Error dropping collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Create index
  async createIndex(collectionName, indexSpec, options = {}) {
    try {
      const result = await this.db
        .collection(collectionName)
        .createIndex(indexSpec, options);
      return { indexName: result };
    } catch (error) {
      console.error(`Error creating index on ${collectionName}:`, error);
      throw error;
    }
  }

  // Helper method to convert string IDs to ObjectId
  processObjectIds(query) {
    const processed = { ...query };

    // Process _id field if it exists as a string
    if (processed._id && typeof processed._id === "string") {
      try {
        processed._id = new ObjectId(processed._id);
      } catch (e) {
        // If it's not a valid ObjectId, leave it as is
      }
    }

    // Process _id in query operators
    if (processed._id && typeof processed._id === "object") {
      Object.keys(processed._id).forEach((op) => {
        if (typeof processed._id[op] === "string") {
          try {
            processed._id[op] = new ObjectId(processed._id[op]);
          } catch (e) {
            // If it's not a valid ObjectId, leave it as is
          }
        }
      });
    }

    return processed;
  }
}

module.exports = MongoDBService;
