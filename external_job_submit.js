import request from 'request';
import {readFileSync} from 'fs';
import {html_to_json, get_species} from './index.js';



if (process.argv.length !== 4) {
    console.error("Usage: node external_job_submit.js <DOMAIN> <HTML_FILE_PATH>");
    process.exit(1);
}


const domain = process.argv[2];
const htmlFilePath = process.argv[3];
const res = html_to_json(htmlFilePath, null);
const sequence_model = res.sequence_model;
const job_model = res.job_model;

const speciesFile = readFileSync('./species_dict.json', 'utf8');
const jsonObject = JSON.parse(speciesFile);



// let species = await get_species(domain, sequence_model.protein_id);

job_model.species = jsonObject[sequence_model.protein_id].toLowerCase();

request.post(
    {url: domain + '/external-job',
    json: { 
        sequence_model:  sequence_model,
        job_model: job_model
    }
    },
    (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
        if(res.statusCode == 200)
            console.log(domain + "/view?job=" + body.job_number);
    }
)