import { readFileSync } from 'fs';
import request from 'request';
import jsdom from 'jsdom';
import vm from 'vm';

const extract_glmol = (document) => {
    const glmol01_src = document.querySelector("#glmol01_src");
    const glmol01_rep = document.querySelector("#glmol01_rep");

    return {
        'pdb_str': glmol01_src.textContent,
        'ret': glmol01_rep.textContent
    };
}

const extract_js_data = (document) => {
    const dataScript = document.querySelector("#data");
    const textContent = dataScript.textContent.replaceAll("let", ""); // Change scoped "let" variables to global variables

    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(textContent, sandbox);

    return {
        'id_ptm_idx_dict': sandbox.id_ptm_idx_dict,
        'regex_dict': sandbox.regex_dict,
        'background_color': sandbox.background_color,
        'pq': sandbox.pq
    };
}

const convert_to_job_detail = (js_data, species) => {
    return {
        'background_color': js_data.background_color,
        'ptm_annotations': js_data.regex_dict,
        'species': species
    };
}

const convert_to_protein_list = (js_data) => {
    let res = [];
    let test = {};
    let i = 0
    test['protein_id'] = js_data.pq[i][1][0];
    test['sequence'] = js_data.pq[i][1][1][0];
    test['UNID'] = js_data.pq[i][1][1][1];
    test['description'] = js_data.pq[i][1][1][2];
    test['coverage'] = js_data.pq[i][0] / 100;
    test['sequence_coverage'] = js_data.pq[i][2];
    test['ptms'] = js_data.id_ptm_idx_dict[Object.keys(js_data.id_ptm_idx_dict)[0]]; // Only need to grab the first key
    test['has_pdb'] = true;

    return test;
}

export const get_species = (domain, protein_id) => {
    return new Promise((resolve, reject) => {
        const formData = {
            job_number: '',
            protein_id: protein_id
        };
        request.post(
            {
                url: `${domain}/protein-structure`,
                form: formData
            }, (error, res, body) => {
                if (error) {
                    console.error(error);
                    return reject(error);
                }
                if (res.statusCode == 200) {
                    return resolve(JSON.parse(body).species);
                } else {
                    return reject(new Error('Unexpected response status: ' + res.statusCode));
                }
            }
        );
    });
};

export const html_to_json = (htmlFilePath, species) => {
    const { JSDOM } = jsdom;
    const html = readFileSync(htmlFilePath, 'utf8');
    const dom = new JSDOM(html);
    const window = dom.window;
    // const res = extract_glmol(window.document);

    const js_data = extract_js_data(window.document);
    const job_detail = convert_to_job_detail(js_data, species);
    const protein_list = convert_to_protein_list(js_data);

    const res_dict = {
        job_model:  job_detail,
        sequence_model: protein_list,
    }

    return res_dict;
}