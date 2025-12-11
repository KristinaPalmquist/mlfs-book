from flask import Flask, jsonify, request
import subprocess
import papermill as pm
import json
from flask_cors import CORS



import pandas as pd
import os

app = Flask(__name__)
CORS(app)

@app.route('/generate-passenger', methods=['POST'])
def run_notebook():
    # Run the notebook using papermill or nbconvert
    subprocess.run([
        "papermill",
        "notebooks/titanic/scheduled-titanic-feature-pipeline-daily.ipynb",
        "notebooks/titanic/scheduled-titanic-feature-pipeline-daily-output.ipynb"
    ])
    return jsonify({"status": "ok"})



# Save prediction to a persistent file
PREDICTION_FILE = 'notebooks/titanic/prediction.json'


@app.route('/predict-survival', methods=['POST'])
def predict_survival():
    pm.execute_notebook(
        'notebooks/titanic/scheduled-titanic-batch-inference-daily.ipynb',
        'notebooks/titanic/output.ipynb'
    )
    with open(PREDICTION_FILE) as f:
        prediction = json.load(f)
    # Get the last passenger from the CSV
    df = pd.read_csv('data/titanic_fg.csv')
    last_passenger = df.iloc[-1].to_dict()
    # Add passenger to prediction
    prediction['passenger'] = last_passenger
    # Save the prediction to a persistent file (overwrite)
    with open('backend/titanic/last_prediction.json', 'w') as f:
        json.dump(prediction, f)
    return jsonify(prediction)

# Endpoint to get the last prediction
@app.route('/last-prediction', methods=['GET'])
def get_last_prediction():
    last_path = 'backend/titanic/last_prediction.json'
    if os.path.exists(last_path):
        with open(last_path) as f:
            prediction = json.load(f)
        return jsonify(prediction)
    else:
        return jsonify({'error': 'No prediction found'}), 404

if __name__ == '__main__':
    app.run(debug=True)