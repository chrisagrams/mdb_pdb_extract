import sqlite3
import sys
import requests
import json

def get_item_by_key(db_file, protein_id):
    res = None
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        # Execute the query
        cursor.execute("SELECT * FROM protein_data WHERE protein_id=?", (protein_id,))
        item = cursor.fetchone()

        if item:
            res = item
        else:
            print("Row with protein_id '{}' not found.".format(protein_id))
        
    except sqlite3.Error as e:
        print("SQLite error:", e)
    finally:
        if conn:
            conn.close()
    return res

def send_request(url, sequence_model, job_model):
    try:
        response = requests.post(url + "/external-job", json={"sequence_model": sequence_model, "job_model": job_model})
        if response.status_code == 200:
            parsed = json.loads(response.text)
            job_number = parsed['job_number']
            print(url + "/view?job=" + job_number)
        else:
            print("Request failed with status code:", response.status_code)
    except requests.exceptions.RequestException as e:
        print("Request error:", e)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python example_db_query.py db_file protein_id")
        sys.exit(1)
    
    db_file = sys.argv[1]
    protein_id = sys.argv[2]
    
    item = get_item_by_key(db_file, protein_id)

    protein_id = item[0]
    sequence_model = json.loads(item[1])
    job_model = json.loads(item[2])

    send_request("https://scv.lab.gy", sequence_model, job_model)