import weaviate from 'weaviate-ts-client';
import { readFileSync, readdirSync } from 'fs';
import { writeFileSync } from 'fs';

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
    headers: {'X-OpenAI-Api-Key': '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'},
    http: {
      maxSockets: 500
  }
});


// -----------------------------------To view the data stored

client
  .data
  .getter()
  .do()
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.error(err)
  });

// -----------------------------------To view number of data stored in database

client.graphql
      .aggregate()
      .withClassName('Demo')
      .withFields('meta { count }')
      .do()
      .then(res => {
        console.log(JSON.stringify(res, null, 2))
      })
      .catch(err => {
        console.error(JSON.stringify(err, null, 2))
      });

// -----------------------------------Create a schema that contains an image property.

const schemaConfig = {
  'class': 'Demo',
  'vectorizer': 'img2vec-neural',
  'vectorIndexType': 'hnsw',
  'moduleConfig': {
      'img2vec-neural': {
          'imageFields': [
              'image'
          ]
      }
  },
  'properties': [
      {
          'name': 'image',
          'dataType': ['blob']
      },
      {
          'name': 'text',
          'dataType': ['string']
      }
  ]
}

await client.schema
  .classCreator()
  .withClass(schemaConfig)
  .do();

// -----------------------------------To view schemas created that contains an image property.

const schemaRes = await client.schema.getter().do();

console.log(schemaRes)

// -----------------------------------------------------To add single data into vector database.

const img = readFileSync('./testImages/image_1.jpg');

const b64 = toBase64(img);

await client.data.creator()
  .withClassName('Test0')
  .withProperties({
    image: b64,
    text: 'matrix'
  })
  .do();

// ------------------------------------------------------Will return the output

const test = Buffer.from( readFileSync('./test.jpg') ).toString('base64');

const resImage = await client.graphql.get()
  .withClassName('Demo')
  .withFields(['image'])
  .withNearImage({ image: test })
  .withLimit(10)
  .do();

const images = resImage.data.Get.Demo;

images.forEach((image, index) => {
  const filename = `result-${index}.jpg`;
  const imageData = image.image;
  writeFileSync(filename, imageData, 'base64');
});


// -------------------------------------------To delete the class

var className = 'Demo';  

client.schema
  .classDeleter()
  .withClassName(className)
  .do()
  .then(res => {
  console.log(res);
  })
  .catch(err => {
  console.error(err)
  });