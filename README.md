# OPSWAT File Scanner

## Introduction
A simple tool that scans a file against OPSWAT API.
1. Calculates the hash of the file specified by the user (up to 140MB in size)
2. Performs a hash lookup against metadefender.opswat.com and checks if there are previously cached results for the file
3. If results found then skips to 6
4. If results not found then uploads the file and receives a `data_id`
5. Repeatedly polls on the `data_id` to retrieve results, until scanning is done
6. Displays results including overall status and results by engine

## Build and Execute
1. Clone or download the repo: https://github.com/dhwei90/OPSWAT.git
2. Set your API key in `.env` as `APIKEY`
3. Place your file to be scanned in the repo directory
4. Install npm packages: `npm i package.json`
5. Execute application: `node index.js`
6. At the prompt, type in name of the file to be scanned, or press "q" to quit application: e.g. `filesToScan/samplefile.txt`
7. Hit enter and wait for check results
