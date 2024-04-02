import request from 'request';
import { readFileSync } from 'fs';

const f = readFileSync("P08123.json", 'utf8');
const model = JSON.parse(f);

request.post(
    {url: 'http://localhost:8000/external-job',
    json: { 
        structure_model: model.structure_model,
        sequence_model:  model.sequence_model,
        job_model: model.job_model
    }
    },
    (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
    }
)