let summary = {};

function calculateSummary(data) {
  const total = data.length;
  const survived = data.filter(row => row.survived === '1').length;
  const notSurvived = data.filter(row => row.survived === '0').length;
  const avgAge = (
    data.reduce((sum, row) => sum + (parseFloat(row.age) || 0), 0) / total
  ).toFixed(2);
  const classCounts = {};
  data.forEach(row => {
    classCounts[row.pclass] = (classCounts[row.pclass] || 0) + 1;
  });
  const commonClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0][0];
  summary = { total, survived, notSurvived, avgAge, commonClass }
}

let currentPassenger = null;

// Fetch and display database summary
function loadDatabaseSummary() {
    fetch('../../data/titanic_fg.csv')       
        .then(response => response.text())
        .then(csvText => {
            const data = Papa.parse(csvText, { header: true }).data;
            // Now data is an array of objects
            calculateSummary(data);
            
            document.getElementById('summary-content').innerHTML = `
                <ul class="w-4/5 mx-auto divide-y divide-gray-200">
                    <li class="flex justify-between items-center py-3">
                        <span class="font-semibold text-gray-700">Total Passengers:</span>
                        <span class="ml-6 text-gray-900">${summary.total}</span>
                    </li>
                    <li class="flex justify-between items-center py-3">
                        <span class="font-semibold text-gray-700">Survived:</span>
                        <span class="ml-6 text-gray-900">${summary.survived}</span>
                    </li>
                    <li class="flex justify-between items-center py-3">
                        <span class="font-semibold text-gray-700">Did Not Survive:</span>
                        <span class="ml-6 text-gray-900">${summary.notSurvived}</span>
                    </li>
                    <li class="flex justify-between items-center py-3">
                        <span class="font-semibold text-gray-700">Average Age:</span>
                        <span class="ml-6 text-gray-900">${summary.avgAge}</span>
                    </li>
                    <li class="flex justify-between items-center py-3">
                        <span class="font-semibold text-gray-700">Most Common Class:</span>
                        <span class="ml-6 text-gray-900">${summary.commonClass}</span>
                    </li>
                </ul>
            `;
            lastPassengerAdded(data);
        })
    .catch(() => {
        document.getElementById('summary-content').textContent = 'Could not load summary.';
    });
}

window.onload = function() {
    loadDatabaseSummary();
    fetch('http://127.0.0.1:5000/last-prediction')
        .then(response => {
            if (!response.ok) throw new Error('No last prediction');
            return response.json();
        })
        .then(result => {
            let passenger = result.passenger;
            let sexShort = passenger.sex === 'male' ? 'm' : 'f';
            let age = Math.floor(Number(passenger.age));
            let embarked = getEmbarkedFullName(passenger.embarked);
            document.getElementById('prediction-result').textContent =
                (result.survived ? 'Prediction: Survived' : 'Prediction: Did not survive') +
                ` (${sexShort}, ${age}, ${embarked})`;
            document.documentElement.style.height = '100%';
            document.body.style.height = '100%';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.minHeight = '100vh';
            document.body.style.width = '100vw';
            document.body.style.backgroundImage = `url('${result.img_url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.getElementById('prediction-image').src = result.img_url;
        })
        .catch(() => {
            document.getElementById('prediction-result').textContent = '';
            document.getElementById('prediction-image').src = '';
        });
};

function lastPassengerAdded(data) {
    currentPassenger = {...data[data.length -2]};
    document.getElementById('passenger-info').innerHTML = `
        <ul class="w-4/5 mx-auto divide-y divide-gray-200">
            <li class="flex justify-between items-center py-3"><span class="font-semibold text-gray-700">Sex:</span><span class="ml-6 text-gray-900">${currentPassenger.sex}</span></li>
            <li class="flex justify-between items-center py-3"><span class="font-semibold text-gray-700">Age:</span><span class="ml-6 text-gray-900">${Number(currentPassenger.age).toFixed(2)}</span></li>
            <li class="flex justify-between items-center py-3"><span class="font-semibold text-gray-700">Pclass:</span><span class="ml-6 text-gray-900">${currentPassenger.pclass}</span></li>
            <li class="flex justify-between items-center py-3"><span class="font-semibold text-gray-700">Fare:</span><span class="ml-6 text-gray-900">${Number(currentPassenger.fare).toFixed(2)}</span></li>
            <li class="flex justify-between items-center py-3"><span class="font-semibold text-gray-700">Embarked:</span><span class="ml-6 text-gray-900">${getEmbarkedFullName(currentPassenger.embarked)}</span></li>
        </ul>
    `;
}

function generatePassenger() {
    fetch('http://127.0.0.1:5000/generate-passenger', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        
    });
}

function predictSurvival() {
    if (!currentPassenger) {
        lastPassengerAdded(data)
        // document.getElementById('prediction-result').textContent = 'Please generate a passenger first.';
        return;
    }
    console.log(currentPassenger);
    fetch('http://127.0.0.1:5000/predict-survival', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPassenger)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log(response);
        return response.json();
    })
    .then(result => {
        let passenger = result.passenger;
        let sexShort = passenger.sex === 'male' ? 'm' : 'f';
        let age = Number(passenger.age).toFixed(2);
        let embarked = getEmbarkedFullName(passenger.embarked);
        document.getElementById('prediction-result').textContent =
            (result.survived ? 'Prediction: Survived' : 'Prediction: Did not survive') +
            ` (${sexShort}, ${age}, ${embarked})`;
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.minHeight = '100vh';
        document.body.style.width = '100vw';
        document.body.style.backgroundImage = `url('${result.img_url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.getElementById('prediction-image').src = result.img_url;
    })
    .catch(error => {
        console.error('Fetch error:', error);
        document.getElementById('prediction-result').textContent = 'Prediction failed.';
    });
}

function getEmbarkedFullName(code) {
    const map = { C: 'Cherbourg', Q: 'Queenstown', S: 'Southampton' };
    return map[code] || code;
}