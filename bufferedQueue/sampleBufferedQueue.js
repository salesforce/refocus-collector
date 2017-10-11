const bufferedQueue = require('buffered-queue');
let sampleBufferedQueue;

function create(name, size, flshTimeout) {
  sampleBufferedQueue = new Queue('bulkUpsertSampleQueue', {
    size: size,
    flshTimeout: flshTimeout,
  });

  sampleBufferedQueue.on('flush', (data, name) => {
    console.log(data);
  });
}

module.exports = {
  create,
  sampleBufferedQueue,
};