document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const cvFileInput = document.getElementById('cvFile');
    const jobInput = document.getElementById('jobDescription');
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('resultSection');
    const fileWrapper = document.querySelector('.file-upload-wrapper');
    const filePlaceholder = document.querySelector('.file-upload-placeholder');

    // Handle file selection UI
    cvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            fileWrapper.classList.add('has-file');
            filePlaceholder.innerHTML = `<i class="fa-solid fa-file-circle-check"></i><span>${fileName}</span>`;
        } else {
            fileWrapper.classList.remove('has-file');
            filePlaceholder.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i><span>Click to upload PDF or drag and drop</span>`;
        }
    });

    // Result elements
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('scoreText');
    const summaryText = document.getElementById('summaryText');
    const recommendationText = document.getElementById('recommendationText');
    const matchedSkillsList = document.getElementById('matchedSkillsList');
    const missingSkillsList = document.getElementById('missingSkillsList');

    analyzeBtn.addEventListener('click', async () => {
        const cvFile = cvFileInput.files[0];
        const jobDescription = jobInput.value.trim();

        if (!cvFile || !jobDescription) {
            alert('Please upload a CV (PDF) and enter Job Description.');
            return;
        }

        // Show loader, hide results
        loader.classList.remove('hidden');
        resultSection.classList.add('hidden');
        analyzeBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('cvFile', cvFile);
            formData.append('jobDescription', jobDescription);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData // No Content-Type header needed, fetch adds it automatically
            });

            const data = await response.json();

            if (response.ok) {
                renderResults(data);
            } else {
                alert(data.error || 'Something went wrong during analysis.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to the server.');
        } finally {
            loader.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });

    function renderResults(data) {
        resultSection.classList.remove('hidden');

        // Update Score
        const score = data.match_score || 0;
        scoreText.textContent = `${score}%`;

        // Calculate stroke-dasharray (circumference is approx 100 for pathLength="100" logic, but SVG is viewBox 0 36)
        // Circumference of radius 15.9155 is ~100.
        // Stroke dasharray: matched, total
        scoreCircle.setAttribute('stroke-dasharray', `${score}, 100`);

        // Color code the score
        if (score >= 80) scoreCircle.style.stroke = 'var(--success-color)';
        else if (score >= 50) scoreCircle.style.stroke = 'var(--warning-color)';
        else scoreCircle.style.stroke = 'var(--danger-color)';

        // Update Text
        summaryText.textContent = data.summary || "No summary available.";
        recommendationText.textContent = data.recommendation || "No recommendation available.";

        // Update Skills
        updateList(matchedSkillsList, data.matched_skills);
        updateList(missingSkillsList, data.missing_skills);

        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function updateList(element, items) {
        element.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                element.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "None";
            li.style.background = "transparent";
            li.style.border = "none";
            element.appendChild(li);
        }
    }
});
