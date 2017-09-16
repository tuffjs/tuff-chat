const path = require('path');
const fs = require('fs');
const workingDir = process.cwd();

const clientAddress = require('./client-address');

function writeHeaders (res, file) {
  res.writeHead(200,
    Object.assign({},
      { 'Content-Type': file[1],
        'Cache-Control': file[2] ? 'public, max-age=' + file[2] : 'max-age=0',
      },
      file[3] ? { 'ETag': file[3] } : {}
    )
  );
}

function serveFilesystemResource (req, res, file) {

  const fileName = file[0];
  const fullPath = path.join(workingDir, '/public/' + fileName);
  
  const addr = clientAddress(req);
  console.log(new Date().valueOf(),
    addr.ip + ':' + addr.port,
    req.headers['user-agent'],
    'Serving file', fullPath);

  try {
    const rstream = fs.createReadStream(fullPath);

    writeHeaders(res, file);
    
    rstream.pipe(res);
  } catch (e) {
    console.log('Standard resource file not found!', e);
    res.writeHead(404);
    return res.end();
  }
}

// TODO: support streams in par with fixed memory
function serveInMemoryResource (req, res, file) {

  var fileData = file[0]();
  
  if (!fileData) {
    console.log('In-Memory resource is null!');
    res.writeHead(404);
    return res.end();
  }

  const addr = clientAddress(req);
  console.log(new Date().valueOf(),
    addr.ip + ':' + addr.port,
    req.headers['user-agent'],
    'Serving in-memory resource for', req.url);

  try {
    writeHeaders(res, file);

    res.end(fileData);

  } catch (e) {
    res.writeHead(404);
    return res.end();
  }
}

module.exports = hostedFiles => (req, res) => {

  const file = hostedFiles[req.url];
  if (!file) {
    res.writeHead(404);
    return res.end();
  }
  
  if (typeof(file[0]) == 'function') {
    return serveInMemoryResource(req, res, file);
  } else {
    return serveFilesystemResource(req, res, file);
  }
}

