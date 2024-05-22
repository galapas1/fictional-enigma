const util = require('util');
const zlib = require('zlib');
const inflate = util.promisify(zlib.inflate);

const { S3 } = require("@aws-sdk/client-s3");

const mongoClient = require('mongodb').MongoClient;

let cachedDb = null;

function connectToDatabase(dbConnectionString) {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  return mongoClient.connect(dbConnectionString).
    then((db) => {
        cachedDb = db;
        return cachedDb;
    });
}

exports.handler = async (event, context, callback) => {
    let response = {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Unknown Error`
        })
    };

    const awsRegion = process.env.AWS_REGION || 'us-east-1'
    const dbName = process.env.DB_NAME
    const dbConnectionString = process.env.DB_CONNECTION_STRING
    const rawBucketName = process.env.S3_RAW_BUCKET
    const bucketName = process.env.S3_PRETTY_BUCKET

    if (!(dbName && dbConnectionString && rawBucketName)) {
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: `Internal Error: invalid configuration`
        });

        return response;
    }

    console.log(JSON.stringify(event));
    const bucketKey = event['bucket_key'];

    if (!bucketKey) {
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: `Internal Error: invalid lambda invoke`
        });

        return response;
    }

    return downloadFromS3(rawBucketName, bucketKey, awsRegion)
        .then((s3Data) => {
            return s3Data.Body.transformToString()
                .then((b64Str) => {
                    const compressed = Buffer.from(b64Str, 'base64');

                    return inflate(compressed)
                        .then((jsonStr) => {
                            const pubData = JSON.parse(jsonStr);

                            return savePubData(bucketName, bucketKey, pubData,
                                dbConnectionString, dbName, awsRegion)
                                .then(() => {
                                    console.log(`docdb updated for ${bucketKey} successful`);

                                    response.statusCode = 200;
                                    response.isBase64Encoded = false;
                                    response.body = JSON.stringify({
                                        message: `docdb updated for ${bucketKey}`
                                    });

                                    return response;
                                },
                                    (err) => {
                                        response.statusCode = 412;
                                        response.body = JSON.stringify({
                                            message: `failed to save pub data`
                                        });

                                        return response;
                                    });
                        }, 
                            (err) => {
                                response.statusCode = 412;
                                response.body = JSON.stringify({
                                    message: `failed to inflate compressed`
                                });

                                return response;
                            });
                },
                (err) => {
                    response.statusCode = 412;
                    response.body = JSON.stringify({
                        message: `failed to transform to test`
                    });

                    return response;

                });
        },
        (err) => {
            response.statusCode = 412;
            response.body = JSON.stringify({
                message: `failed to inflate compressed`
            });

            return response;
        });
};

function downloadFromS3(rawBucketName, bucketKey, awsRegion) {
    return new Promise((resolve, reject) => {
        const s3 = new S3({
            region: awsRegion
        });

        const getObjectOptions = {
            Bucket: rawBucketName, 
            Key: bucketKey
        };

         s3.getObject(getObjectOptions,
             (err, data) => {
                 if (err) {
                     return reject({
                         message: "failed to get object",
                         error: err
                     });
                 }
                 resolve(data);
             });
    });
}

function uploadToS3(bucketName, bucketKey, data, awsRegion) {
    return new Promise((resolve, reject) => {
        const s3 = new S3({
            region: awsRegion
        });

        const putObjectOptions = {
            Bucket: bucketName, 
            Key: bucketKey,
            Body: JSON.stringify(data)
        };

         s3.putObject(putObjectOptions, (err) => {
             if (err) {
               console.log(`failed to put object: ${JSON.stringify(err)}`);
               return reject(new Error(`error: ${err}`));
             }
             resolve();
         });
    });
}

function savePubData(
    bucketName, bucketKey, pubData,
    dbConnectionString, dbName, awsRegion) {
  return new Promise((resolve, reject) => {
    connectToDatabase(dbConnectionString)
      .then((db) => {
          const dbo = db.db(dbName);

          dbo.listCollections().toArray()
            .then((collections) => {
              const collection = find(collections, bucketKey);
              if (!!collection) {
                  console.log('collection exists');
                  resolve();
              } else {
                  dbo.collection(bucketKey).insertOne(pubData)
                  .then((result) => {
                      console.log('insert one success');
                      dbo.collection(bucketKey).findOne()
                        .then((doc) => {
                            if (!doc) {
                              console.log(`findOne failed...${JSON.stringify(err)}`);
                              return reject({
                                message: "failed to findOne",
                                error: err
                              });
                            }
                            console.log('find one success');
                            uploadToS3(bucketName, bucketKey, doc['html'], awsRegion)
                                .then(() => {
                                    console.log('upload to s3 succeeded');
                                    resolve();
                                },
                                (err) => {
                                  console.log(`upload to s3 failed...${JSON.stringify(err)}`);
                                  return reject({
                                    message: "upload to s3 failed.",
                                    error: err
                                  });
                              });
                            });
                  },
                  (err) => {
                      return reject({
                        message: "failed to insertOne",
                        error: err
                      });
                  });
              }
            },
            (err) => {
                return reject({
                  message: "failed to list collections",
                  error: err
                });
              });
          });
      });
}

function find(arr, tag) {
  var i = arr.length;
  while (i--) {
    if (arr[i].name === tag) {
        return arr[i];
    }
  }
  return undefined;
}
