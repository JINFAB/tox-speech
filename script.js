document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('classifyButton').addEventListener('click', classifyText);

    let chatLog = '';

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                chatLog = e.target.result;
                document.getElementById('fileContent').textContent = chatLog;
                document.getElementById('loadingText').textContent = '';
                document.getElementById('resultText').textContent = '';
            };
            reader.readAsText(file);
            document.getElementById('loadingText').textContent = 'Uploading the txt file...';
        }
    }

    async function classifyText() {
        document.getElementById('loadingText').textContent = 'Analyzing chat log for toxicity...';
    
        const threshold = 0.9;
        const model = await toxicity.load(threshold);
    
        const sentences = chatLog.split('\n').map(line => {
            const match = line.match(/\] (.+?): (.+)/);
            return match ? { user: match[1], message: match[2] } : null;
        }).filter(item => item && item.message.trim() !== '');
    
        if (sentences.length === 0) {
            document.getElementById('loadingText').textContent = '';
            document.getElementById('resultText').textContent = 'No content to classify.';
            return;
        }
    
        let results = {};
    
        for (const { user, message } of sentences) {
            const predictions = await model.classify([message]);
    
            predictions.forEach(prediction => {
                if (prediction.results[0].match) {
                    if (!results[user]) {
                        results[user] = { toxicWords: new Set(), toxicTypes: new Set() };
                    }
                    results[user].toxicTypes.add(prediction.label);
    
                }
            });
        }
    
        document.getElementById('loadingText').textContent = '';
    
        let report = '===============Chat Log Report===============<br>';
        for (const user in results) {
            const toxicTypes = [...results[user].toxicTypes].join(', ');
            report += `<div style="margin-bottom: 20px;">${user} is using toxic language<br>`;
            report += `Type: ${toxicTypes}</div>`;
        }
        document.getElementById('resultText').innerHTML = report || 'The chat log is clean!';        
    }
    
});
