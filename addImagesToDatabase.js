import weaviate from 'weaviate-ts-client';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

const agent = new http.Agent({
  maxSockets: 3000,
  keepAlive: true,
  keepAliveMsecs: 10000,
});

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
  headers: {'X-OpenAI-Api-Key': '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'},
  agent: agent,
});

const batchSize = 100; // set the desired batch size
const imgDir = './testImages'; // directory containing the images to import
const imgFiles = readdirSync(imgDir);
const numBatches = Math.ceil(imgFiles.length / batchSize);

for (let i = 0; i < numBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, imgFiles.length);
  const batch = imgFiles.slice(start, end);

  const batchObjects = batch.map((imgFile) => {
    const imgPath = path.join(imgDir, imgFile);
    const imgData = readFileSync(imgPath);
    const b64Img = Buffer.from(imgData).toString('base64');

    return {
      class: 'Demo',
      id: uuidv4(),
      properties: {
        image: b64Img,
        text: imgFile.split('.')[0].split('_').join(' ')
      }
    };
  });

  for (let j = 0; j < batchObjects.length; j++) {
    const batchObject = batchObjects[j];
    await client.data.creator()
      .withClassName(batchObject.class)
      .withProperties(batchObject.properties)
      .do()
      .then(res => console.log(`Imported 1 image`))
      .catch(err => console.error(`Failed to import image: ${err}`));
  }

  console.log(`Imported ${batch.length} images`);
}
