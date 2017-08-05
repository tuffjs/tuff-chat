const path = require('path');
const fs = require('fs');
const workingDir = process.cwd();

const clientAddress = require('./client-address');

module.exports = hostedFiles => (req, res) => {

  const file = hostedFiles[req.url];
  if (!file) {
    res.writeHead(404);
    return res.end();
  }
  
  const fileName = file[0];

  const fullPath = path.join(workingDir, '/public/' + fileName);

  const addr = clientAddress(req);
  console.log(new Date().valueOf(),
    addr.ip + ':' + addr.port,
    'Serving file', fullPath);
  
  try {
    const rstream = fs.createReadStream(fullPath);
    res.writeHead(200,
      Object.assign({},
        { 'Content-Type': file[1],
          'Cache-Control': file[2] ? 'public, max-age=' + file[2] : 'max-age=0',
        },
        file[3] ? { 'ETag': file[3] } : {}
      )
    );
    rstream.pipe(res);
  } catch (e) {
    console.log('Standard resource file not found!', e);
    res.writeHead(404);
    return res.end();
  }
}

