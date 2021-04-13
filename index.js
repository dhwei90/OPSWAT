require('dotenv').config();
const http = require('https');
const md5File = require('md5-file');
const prompt = require('prompt-sync')();
const fs = require('fs');

let filename, hash;

while (true) { // Prompts user to enter name of file to be scanned
    filename = prompt('Name of file to be scanned (press "q" to quit): ');
    if (filename === 'q')
        process.exit(1);

    try {
        hash = md5File.sync(filename); // Calculates MD5 hash
        break;
    }

    catch (e) {
        console.log('File not found! Please try again!');
    }
}

hashScan(); // Runs main program: starting by data hash scan

function hashScan() { // Retrieves scan results using a data hash
    console.log('Retrieving scan results using a data hash...');

    const options = {
        "method": "GET",
        "hostname": "api.metadefender.com",
        "path": `/v4/hash/${hash}`,
        "headers": {
            "apikey": process.env.APIKEY // API key
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try {
                const obj = JSON.parse(body);
                if (obj.scan_results) { // Hash found: displays results
                    console.log("Hash found in cache!");
                    getOutput(obj);
                }

                else if (obj.error) { // Hash not found: upload and scan using data ID
                    console.log("Hash not found! Uploading file for scanning...");
                    upload(filename);
                }
            }
            
            catch(e) {
                console.log(e);
            }
        });
    });

    req.end();
}

function upload(filename) { // Scans a file by file upload (as multipart)
    const file = fs.readFileSync(filename);
    const boundary = '69b2c2b9c464731d'
    const content = "--" + boundary + "\r\n"
        + `Content-Disposition: form-data; name=\"file\"; filename=\"${filename}\"\r\n`
        + "Content-Type: application/octet-stream\r\n"
        + "Content-Transfer-Encoding: BINARY\r\n"
        + "\r\n"
        + file + "\r\n"
        + "--" + boundary + "--\r\n";

    const options = {
        "method": "POST",
        "hostname": "api.metadefender.com",
        "path": "/v4/file",
        "headers": {
            "Content-Type": 'multipart/form-data; boundary=' + boundary,
            "apikey": process.env.APIKEY,
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try { // Upload successful: retrieves ID and scan
                const dataId = JSON.parse(body).data_id;
                if (!dataId)
                    console.log('Upload failed!');
                else {
                    console.log('Upload done! Retrieving scan results using data ID...');
                    dataIdScan(dataId);
                }
            }
            
            catch(e) {
                console.log(e);
            }
        });
    });

    req.write(content);
    req.end();
}

function dataIdScan(dataId) { // Retrieves scan results using data ID
    const options = {
        "method": "GET",
        "hostname": "api.metadefender.com",
        "path": `/v4/file/${dataId}`,
        "headers": {
            "apikey": process.env.APIKEY
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);

            try {
                const obj = JSON.parse(body);
                const prog = obj.scan_results.progress_percentage; // progress percentage
                if (prog < 100) { // keeps polling every second until scanning is done
                    setTimeout(() => {
                        console.log(`${prog}% done...`);
                        dataIdScan(dataId);
                    }, 1000);
                }
                else // displays results
                    getOutput(obj);
            }

            catch (e) {
                console.log(e);
            }
        });
    });

    req.end();
}

function getOutput(obj) { // Displays results in the given format 
    try {
        console.log(`filename: ${filename}`);
        const res = obj.scan_results;
        console.log(`overall_status: ${res.scan_all_result_a}`);

        for (let engine in res.scan_details) {
            const sub = res.scan_details[engine];
            console.log(`engine: ${engine}`);
            console.log(`threat_found: ${sub.threat_found}`);
            console.log(`scan_result: ${sub.scan_result_i}`);
            console.log(`def_time: ${sub.def_time}`);
        }

        console.log('END');
    }
    
    catch(e) {
        console.log('Parsing error!');
    }
}