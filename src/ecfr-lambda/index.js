/* global fetch */

const fs = require('fs');
const util = require('util');
const zlib = require('zlib');
const cheerio = require('cheerio');
const deflate = util.promisify(zlib.deflate);

const { S3 } = require("@aws-sdk/client-s3");
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");

const { fetch, setGlobalDispatcher, Agent } = require('undici');
setGlobalDispatcher(new Agent({ connect: { timeout: 60_000 } }) )

exports.handler = async (event, context, callback) => {
    let response = {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Headers": "*"
        },
        isBase64Encoded: false,
        body: JSON.stringify({
            message: `Invalid Request: refer to openapi spec`
        })
    };

    const awsRegion = process.env.AWS_REGION || 'us-east-1'
    const baseUrl = process.env.ECFR_BASE_URL
    const bucketName = process.env.S3_RAW_BUCKET
    const docdbLambda = process.env.DOCDB_LAMBDA

    if (!baseUrl) {
        response.statusCode = 400;
        response.body = JSON.stringify({
            message: `invalid configuration`
        });

        return response;
    }

    let pubDate = event['pubDate'];
    let title = event['title'];

    if (!isValidDate(pubDate)) {
        response.body = JSON.stringify({
            message: `Malformed Request: pubDate must be 'yyyy-mm-dd'`
        });

        return response;
    }

    if (!isValidTitle(title)) {
        response.body = JSON.stringify({
            message: `Malformed Request: title must be 'title-<num>'`
        });

        return response;
    }

    console.log("calling getPublicationByDateAndTitle...");
    return getPublicationByDateAndTitle(baseUrl, pubDate, title)
        .then((htmlData) => {
            console.log("got html data...");
            const jsonData = htmlToJson(htmlData);

            console.log("compressing json...");
            return deflate(JSON.stringify(jsonData))
              .then((buffer) => {
                  console.log("json compressed...");
                  const b64Data = buffer.toString('base64');

                  const bucketKey = `${pubDate}__${title}`;
                  return uploadToS3(bucketName, bucketKey, b64Data, awsRegion)
                      .then(() => {
                          console.log("trigger doc db save...");
                          return triggerDocDbSave(docdbLambda, bucketKey)
                              .then(() => {
                                  console.log("returning success!");

                                  response.statusCode = 200;
                                  response.isBase64Encoded = true;
                                  response.body = JSON.stringify(jsonData);

                                  return response;
                              },
                              (err) => {
                                  response.statusCode = 412;
                                  response.body = JSON.stringify({
                                      message: `failed to trigger doc db save: ${err}`
                                  });
                                  
                                  return response;
                              });
                      }, 
                      (err) => {
                          console.log(err);

                          response.statusCode = 412;
                          response.body = JSON.stringify({
                              message: `failed to upload to s3: ${err}`
                          });

                          return response;
                      });
              },
              (err) => {
                  console.log(err);

                  response.statusCode = 412;
                  response.body = JSON.stringify({
                    message: `failed to retrieve publication: ${err}`
                  });

                  return response;
              });
        });
};

function getPublicationByDateAndTitle(baseUrl, pubDate, title) {
    const url = new URL(baseUrl);
    console.log(`${url.protocol}//${url.host}${url.pathname}/${pubDate}/${title}`);

    const headers = new Headers({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });

    return new Promise((resolve, reject) => {
        fetch(`${url.protocol}//${url.host}${url.pathname}/${pubDate}/${title}`, {
          method: 'GET',
          credentials: 'omit',
          redirect: 'follow',
          priority: 'high',
          headers
      })
      .then(response => {
         return response.text();
      },
      (err) => {
        console.log(`failed: ${JSON.stringify(err)}`);
        reject(new Error(`error: ${err}`));
      })
      .then((data) => {
        resolve(data);
      },
      (err) => {
        console.log(`failed to resolve data: ${JSON.stringify(err)}`);
        reject(new Error(`error: ${err}`));
      })
    });    
}

function uploadToS3(bucketName, bucketKey, b64Data, awsRegion) {
    return new Promise((resolve, reject) => {
        const s3 = new S3({
            region: awsRegion
        });

        const putObjectOptions = {
            Bucket: bucketName, 
            Key: bucketKey,
            Body: b64Data
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

function triggerDocDbSave(docdbLambda, bucketKey) {
    return new Promise((resolve, reject) => {
        try {
            const client = new LambdaClient({});
            const command = new InvokeCommand({
                FunctionName: docdbLambda,
                InvocationType: "Event",
                Payload: Buffer.from(JSON.stringify({ bucket_key: bucketKey })),
                LogType: "None"
            });

            client.send(command)
                .then((response) => {
                    console.log(`trigger sent...response: ${JSON.stringify(response)}`);
                    resolve();
                },
                (err) => {
                    console.log("trigger error!");
                    return reject(err);
                });

        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
}

function htmlToJson(htmlData) {
    const $ = cheerio.load(htmlData);

    const jsonData = {};

    $('*').each((indx, element) => {
        const tag = element.tagName;

        const elementData = {};

        if (!$(element).attr() === null) {
            $(element).attr().each((attr, value) => {
                elementData[attr] = value;
            });
        }

        elementData.textContent = $(element).text();

        jsonData[tag] = elementData;
    });

    console.log("converted to json data...");
    return jsonData;
}

function isValidDate(dateString) {
    if (!dateString) {
        return false;
    }

    let regEx = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateString.match(regEx)) {
        return false;
    }

    let date = new Date(dateString);
    let dateAsNum = date.getTime();

    if(!dateAsNum && dateAsNum !== 0) {
        return false;
    }

    return date.toISOString().slice(0,10) === dateString;
}

function isValidTitle(title) {
    if (!title) {
        return false;
    }

    let regEx = /^title-\d+$/;

    if (!title.match(regEx)) {
        return false;
    }

    return true;
}
