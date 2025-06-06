// Global variables
let currentUser = null;
let currentTopic = null;
let criteria = [];
let sharedCriteria = [];
let candidates = [];
let evaluations = [];
let rankings = [];
const socket = io();

// Utility function to add cache-busting parameter to API calls
function noCacheUrl(url) {
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_nocache=${timestamp}`;
}

// DOM elements - Phase indicators
const phaseCircles = document.querySelectorAll('.phase-circle');
const phaseLine12 = document.getElementById('phase-line-1-2');
const phaseLine23 = document.getElementById('phase-line-2-3');
const nextPhaseBtn = document.getElementById('next-phase-btn');
const prevPhaseBtn = document.getElementById('prev-phase-btn');

// DOM elements - Content sections
const phase1Content = document.getElementById('phase-1-content');
const phase2Content = document.getElementById('phase-2-content');
const phase3Content = document.getElementById('phase-3-content');

// DOM elements - Phase 1
const personalCriteriaList = document.getElementById('personal-criteria-list');
const sharedCriteriaList = document.getElementById('shared-criteria-list');
const newCriterionForm = document.getElementById('new-criterion-form');

// DOM elements - Phase 2
const candidatesList = document.getElementById('candidates-list');
const evaluationMatrix = document.getElementById('evaluation-matrix');
const newCandidateForm = document.getElementById('new-candidate-form');
const evaluationForm = document.getElementById('evaluation-form');

// DOM elements - Phase 3
const candidateRanking = document.getElementById('candidate-ranking');
const saveRankingBtn = document.getElementById('save-ranking-btn');
const discrepanciesList = document.getElementById('discrepancies-list');
const suggestedCriteriaList = document.getElementById('suggested-criteria-list');

// DOM elements - Topic info
const topicName = document.getElementById('topic-name');
const topicDescription = document.getElementById('topic-description');
const participantsList = document.getElementById('participants-list');
const inviteForm = document.getElementById('invite-form');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        
        // Get topic ID from URL
        const topicId = window.location.pathname.split('/').pop();
        
        // Load topic data
        loadTopic(topicId);
        
        // Join socket room for this topic
        socket.emit('joinTopic', topicId);
    } else {
        // Redirect to home if not logged in
        window.location.href = '/';
    }
    
    // Socket event listeners
    socket.on('criterionAdded', (data) => {
        // Reload criteria if it was added by someone else
        if (data.userId !== currentUser._id) {
            loadCriteria();
        }
    });
    
    socket.on('candidateAdded', (data) => {
        // Reload candidates if it was added by someone else
        if (data.userId !== currentUser._id) {
            loadCandidates();
        }
    });
    
    socket.on('evaluationAdded', (data) => {
        // Reload evaluations if it was added by someone else
        if (data.userId !== currentUser._id) {
            loadEvaluations();
        }
    });
    
    // Next phase button
    if (nextPhaseBtn) {
        nextPhaseBtn.addEventListener('click', advanceToNextPhase);
    }
    
    // Previous phase button
    if (prevPhaseBtn) {
        prevPhaseBtn.addEventListener('click', goToPreviousPhase);
    }
    
    // New criterion form
    if (newCriterionForm) {
        newCriterionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('criterion-name').value;
            const description = document.getElementById('criterion-description').value;
            const isShared = document.getElementById('criterion-shared').checked;
            
            createNewCriterion(name, description, isShared);
        });
    }
    
    // New candidate form
    if (newCandidateForm) {
        newCandidateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('candidate-name').value;
            const description = document.getElementById('candidate-description').value;
            
            createNewCandidate(name, description);
        });
    }
    
    // Evaluation form
    if (evaluationForm) {
        evaluationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const candidateId = document.getElementById('evaluation-candidate-id').value;
            const criterionId = document.getElementById('evaluation-criterion-id').value;
            const score = parseInt(document.getElementById('evaluation-score').value);
            const notes = document.getElementById('evaluation-notes').value;
            
            saveEvaluation(candidateId, criterionId, score, notes);
        });
        
        // Update score display when slider changes
        const scoreSlider = document.getElementById('evaluation-score');
        const scoreDisplay = document.getElementById('evaluation-score-display');
        
        if (scoreSlider && scoreDisplay) {
            scoreSlider.addEventListener('input', () => {
                scoreDisplay.textContent = scoreSlider.value;
            });
        }
    }
    
    // Save ranking button
    if (saveRankingBtn) {
        saveRankingBtn.addEventListener('click', saveRankings);
    }
    
    // Invite form
    if (inviteForm) {
        inviteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('invite-email').value;
            inviteParticipant(email);
        });
    }
});

// Load topic data
function loadTopic(topicId) {
    fetch(noCacheUrl(`/api/topics/${topicId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error('Topic not found');
            }
            return response.json();
        })
        .then(topic => {
            currentTopic = topic;
            
            // Update topic info
            updateTopicInfo();
            
            // Update phase display
            updatePhaseDisplay();
            
            // Load data for the current phase
            loadPhaseData();
            
            // Load participants
            loadParticipants();
        })
        .catch(error => {
            console.error('Error loading topic:', error);
            alert('Failed to load topic. Redirecting to dashboard.');
            window.location.href = '/dashboard';
        });
}

// Update topic info display
function updateTopicInfo() {
    if (!currentTopic) return;
    
    if (topicName) {
        topicName.textContent = currentTopic.name;
    }
    
    if (topicDescription) {
        topicDescription.textContent = currentTopic.description || 'No description provided';
    }
}

// Update phase display
function updatePhaseDisplay() {
    if (!currentTopic) return;
    
    const currentPhase = currentTopic.currentPhase;
    
    // Update phase circles
    phaseCircles.forEach(circle => {
        const phase = parseInt(circle.getAttribute('data-phase'));
        
        if (phase < currentPhase) {
            circle.classList.add('completed');
            circle.classList.remove('active');
        } else if (phase === currentPhase) {
            circle.classList.add('active');
            circle.classList.remove('completed');
        } else {
            circle.classList.remove('active', 'completed');
        }
    });
    
    // Update phase lines
    if (phaseLine12) {
        if (currentPhase > 1) {
            phaseLine12.classList.add('active');
        } else {
            phaseLine12.classList.remove('active');
        }
    }
    
    if (phaseLine23) {
        if (currentPhase > 2) {
            phaseLine23.classList.add('active');
        } else {
            phaseLine23.classList.remove('active');
        }
    }
    
    // Show/hide phase content
    if (phase1Content) {
        phase1Content.classList.toggle('d-none', currentPhase !== 1);
    }
    
    if (phase2Content) {
        phase2Content.classList.toggle('d-none', currentPhase !== 2);
    }
    
    if (phase3Content) {
        phase3Content.classList.toggle('d-none', currentPhase !== 3);
    }
    
    // Update next phase button
    if (nextPhaseBtn) {
        if (currentPhase < 3) {
            nextPhaseBtn.textContent = `Advance to Phase ${currentPhase + 1}`;
            nextPhaseBtn.disabled = false;
        } else {
            nextPhaseBtn.textContent = 'Final Phase Reached';
            nextPhaseBtn.disabled = true;
        }
    }
    
    // Update previous phase button
    if (prevPhaseBtn) {
        if (currentPhase > 1) {
            prevPhaseBtn.textContent = `Back to Phase ${currentPhase - 1}`;
            prevPhaseBtn.disabled = false;
        } else {
            prevPhaseBtn.textContent = 'First Phase Reached';
            prevPhaseBtn.disabled = true;
        }
    }
}

// Load data for the current phase
function loadPhaseData() {
    if (!currentTopic) return;
    
    const currentPhase = currentTopic.currentPhase;
    
    if (currentPhase === 1) {
        loadCriteria();
    } else if (currentPhase === 2) {
        loadCriteria();
        loadCandidates();
        loadEvaluations();
    } else if (currentPhase === 3) {
        loadCriteria();
        loadCandidates();
        loadEvaluations();
        loadRankings();
        loadAggregatedScores();
        loadDiscrepancies();
        loadSuggestedCriteria();
    }
}

// Load participants
function loadParticipants() {
    if (!currentTopic || !participantsList) return;
    
    // Clear the list
    participantsList.innerHTML = '';
    
    // Fetch participants data
    fetch(`/api/topics/${currentTopic._id}`)
        .then(response => response.json())
        .then(topic => {
            if (topic.participants && topic.participants.length > 0) {
                topic.participants.forEach(participant => {
                    const participantCol = document.createElement('div');
                    participantCol.className = 'col-md-3 col-sm-6 mb-3';
                    
                    let badgeHTML = '';
                    if (participant._id === currentUser._id) {
                        badgeHTML = '<span class="badge bg-primary ms-2">You</span>';
                    }
                    
                    participantCol.innerHTML = `
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">${participant.name} ${badgeHTML}</h6>
                                <p class="card-text text-muted small">${participant.email}</p>
                            </div>
                        </div>
                    `;
                    
                    participantsList.appendChild(participantCol);
                });
            } else {
                participantsList.innerHTML = '<div class="col-12">No participants yet.</div>';
            }
        })
        .catch(error => {
            console.error('Error loading participants:', error);
            participantsList.innerHTML = '<div class="col-12">Error loading participants.</div>';
        });
}

// Load criteria
function loadCriteria() {
    if (!currentTopic) return;
    
    // Load personal criteria
    fetch(noCacheUrl(`/api/criteria/user/${currentUser._id}/topic/${currentTopic._id}`))
        .then(response => response.json())
        .then(data => {
            criteria = data;
            displayPersonalCriteria();
        })
        .catch(error => {
            console.error('Error loading personal criteria:', error);
        });
    
    // Load shared criteria
    fetch(`/api/criteria/shared/topic/${currentTopic._id}`)
        .then(response => response.json())
        .then(data => {
            sharedCriteria = data;
            displaySharedCriteria();
        })
        .catch(error => {
            console.error('Error loading shared criteria:', error);
        });
}

// Display personal criteria
function displayPersonalCriteria() {
    if (!personalCriteriaList) return;
    
    personalCriteriaList.innerHTML = '';
    
    if (criteria.length === 0) {
        personalCriteriaList.innerHTML = `
            <div class="list-group-item">
                <p class="mb-0">You haven't added any criteria yet. Add one to get started!</p>
            </div>
        `;
        return;
    }
    
    // Sort criteria by rank
    criteria.sort((a, b) => a.rank - b.rank);
    
    criteria.forEach(criterion => {
        const criterionItem = document.createElement('div');
        criterionItem.className = 'list-group-item criterion-card';
        criterionItem.setAttribute('data-id', criterion._id);
        
        let badgeHTML = '';
        if (criterion.isShared) {
            badgeHTML = '<span class="badge criterion-shared-badge ms-2">Shared</span>';
        } else {
            badgeHTML = '<span class="badge criterion-personal-badge ms-2">Personal</span>';
        }
        
        criterionItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${criterion.name} ${badgeHTML}</h6>
                <span class="badge bg-secondary">Rank: ${criterion.rank}</span>
            </div>
            <p class="mb-0 small text-muted">${criterion.description || 'No description'}</p>
        `;
        
        personalCriteriaList.appendChild(criterionItem);
    });
    
    // Make criteria sortable
    if (typeof Sortable !== 'undefined') {
        Sortable.create(personalCriteriaList, {
            animation: 150,
            onEnd: function(evt) {
                // Update rankings
                const items = personalCriteriaList.querySelectorAll('.criterion-card');
                const rankings = [];
                
                items.forEach((item, index) => {
                    rankings.push({
                        criterionId: item.getAttribute('data-id'),
                        rank: index + 1
                    });
                });
                
                // Save new rankings
                fetch('/api/criteria/rank', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ rankings })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to update rankings');
                        }
                        return response.json();
                    })
                    .then(() => {
                        // Reload criteria
                        loadCriteria();
                    })
                    .catch(error => {
                        console.error('Error updating rankings:', error);
                        // Reload criteria to reset the display
                        loadCriteria();
                    });
            }
        });
    }
}

// Display shared criteria
function displaySharedCriteria() {
    if (!sharedCriteriaList) return;
    
    sharedCriteriaList.innerHTML = '';
    
    if (sharedCriteria.length === 0) {
        sharedCriteriaList.innerHTML = `
            <div class="list-group-item">
                <p class="mb-0">No shared criteria yet. Mark your criteria as shared to add them here.</p>
            </div>
        `;
        return;
    }
    
    sharedCriteria.forEach(criterion => {
        const criterionItem = document.createElement('div');
        criterionItem.className = 'list-group-item';
        
        criterionItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">${criterion.name}</h6>
                <span class="badge bg-secondary">From: ${criterion.user.name}</span>
            </div>
            <p class="mb-0 small text-muted">${criterion.description || 'No description'}</p>
        `;
        
        sharedCriteriaList.appendChild(criterionItem);
    });
}

// Create a new criterion
function createNewCriterion(name, description, isShared) {
    if (!currentTopic || !currentUser) return;
    
    fetch('/api/criteria', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            topicId: currentTopic._id,
            userId: currentUser._id,
            isShared
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create criterion');
            }
            return response.json();
        })
        .then(criterion => {
            // Notify other users
            socket.emit('newCriterion', {
                topicId: currentTopic._id,
                userId: currentUser._id,
                criterion
            });
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newCriterionModal'));
            modal.hide();
            
            // Clear the form
            newCriterionForm.reset();
            
            // Reload criteria
            loadCriteria();
        })
        .catch(error => {
            console.error('Error creating criterion:', error);
            alert('Failed to create criterion. Please try again.');
        });
}

// Load candidates
function loadCandidates() {
    if (!currentTopic) return;
    
    fetch(noCacheUrl(`/api/candidates/topic/${currentTopic._id}`))
        .then(response => response.json())
        .then(data => {
            candidates = data;
            displayCandidates();
            
            // Update evaluation matrix if in phase 2
            if (currentTopic.currentPhase === 2) {
                displayEvaluationMatrix();
            }
        })
        .catch(error => {
            console.error('Error loading candidates:', error);
        });
}

// Display candidates
function displayCandidates() {
    if (!candidatesList) return;
    
    candidatesList.innerHTML = '';
    
    if (candidates.length === 0) {
        candidatesList.innerHTML = `
            <div class="col-12">
                <p class="mb-0">No candidates yet. Add one to get started!</p>
            </div>
        `;
        return;
    }
    
    candidates.forEach(candidate => {
        const candidateCol = document.createElement('div');
        candidateCol.className = 'col-md-4 mb-4';
        
        candidateCol.innerHTML = `
            <div class="card h-100 candidate-card" data-id="${candidate._id}">
                <div class="card-body">
                    <h5 class="card-title">${candidate.name}</h5>
                    <p class="card-text">${candidate.description || 'No description'}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <small class="text-muted">Added by ${candidate.createdBy.name}</small>
                </div>
            </div>
        `;
        
        candidatesList.appendChild(candidateCol);
    });
}

// Create a new candidate
function createNewCandidate(name, description) {
    if (!currentTopic || !currentUser) return;
    
    fetch('/api/candidates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            topicId: currentTopic._id,
            userId: currentUser._id
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create candidate');
            }
            return response.json();
        })
        .then(candidate => {
            // Notify other users
            socket.emit('newCandidate', {
                topicId: currentTopic._id,
                userId: currentUser._id,
                candidate
            });
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newCandidateModal'));
            modal.hide();
            
            // Clear the form
            newCandidateForm.reset();
            
            // Reload candidates
            loadCandidates();
        })
        .catch(error => {
            console.error('Error creating candidate:', error);
            alert('Failed to create candidate. Please try again.');
        });
}

// Load evaluations
function loadEvaluations() {
    if (!currentTopic || !currentUser) return;
    
    fetch(noCacheUrl(`/api/evaluations/user/${currentUser._id}/topic/${currentTopic._id}`))
        .then(response => response.json())
        .then(data => {
            evaluations = data;
            
            // Update evaluation matrix if in phase 2
            if (currentTopic.currentPhase === 2) {
                displayEvaluationMatrix();
            }
        })
        .catch(error => {
            console.error('Error loading evaluations:', error);
        });
}

// Display evaluation matrix
function displayEvaluationMatrix() {
    if (!evaluationMatrix || !criteria || !candidates) return;
    
    evaluationMatrix.innerHTML = '';
    
    if (criteria.length === 0 || candidates.length === 0) {
        evaluationMatrix.innerHTML = `
            <div class="alert alert-info">
                You need both criteria and candidates to start evaluations.
            </div>
        `;
        return;
    }
    
    // Create the matrix table
    const table = document.createElement('table');
    table.className = 'table table-bordered';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Criteria / Candidates</th>'; // Top-left corner label
    
    criteria.forEach(criterion => {
        headerRow.innerHTML += `<th>${criterion.name}</th>`;
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    candidates.forEach(candidate => {
        const row = document.createElement('tr');
        row.innerHTML = `<th>${candidate.name}</th>`;
        
        criteria.forEach(criterion => {
            // Check if evaluation exists
            const evaluation = evaluations.find(e => 
                e.candidate._id === candidate._id && e.criterion._id === criterion._id
            );
            
            let cellClass = 'evaluation-matrix-cell';
            let cellContent = '';
            
            if (evaluation) {
                cellClass += ' evaluated';
                
                // Add class based on score
                if (evaluation.score <= 3) {
                    cellClass += ' evaluation-score-1-3';
                } else if (evaluation.score <= 7) {
                    cellClass += ' evaluation-score-4-7';
                } else {
                    cellClass += ' evaluation-score-8-10';
                }
                
                cellContent = evaluation.score;
            } else {
                cellContent = '-';
            }
            
            const cell = document.createElement('td');
            cell.className = cellClass;
            cell.innerHTML = cellContent;
            
            // Add click event to open evaluation modal
            cell.addEventListener('click', () => {
                openEvaluationModal(candidate, criterion);
            });
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    evaluationMatrix.appendChild(table);
}

// Open evaluation modal
function openEvaluationModal(candidate, criterion) {
    if (!candidate || !criterion) return;
    
    // Set modal fields
    document.getElementById('evaluation-candidate-id').value = candidate._id;
    document.getElementById('evaluation-criterion-id').value = criterion._id;
    document.getElementById('evaluation-candidate-name').textContent = candidate.name;
    document.getElementById('evaluation-candidate-description').textContent = candidate.description || '';
    document.getElementById('evaluation-criterion-name').textContent = criterion.name;
    document.getElementById('evaluation-criterion-description').textContent = criterion.description || '';
    
    // Check if evaluation exists
    const evaluation = evaluations.find(e => 
        e.candidate._id === candidate._id && e.criterion._id === criterion._id
    );
    
    if (evaluation) {
        document.getElementById('evaluation-score').value = evaluation.score;
        document.getElementById('evaluation-score-display').textContent = evaluation.score;
        document.getElementById('evaluation-notes').value = evaluation.notes || '';
    } else {
        document.getElementById('evaluation-score').value = 5;
        document.getElementById('evaluation-score-display').textContent = 5;
        document.getElementById('evaluation-notes').value = '';
    }
    
    // Open the modal
    const modal = new bootstrap.Modal(document.getElementById('evaluationModal'));
    modal.show();
}

// Save evaluation
function saveEvaluation(candidateId, criterionId, score, notes) {
    if (!currentTopic || !currentUser) return;
    
    fetch('/api/evaluations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUser._id,
            candidateId,
            criterionId,
            score,
            notes
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save evaluation');
            }
            return response.json();
        })
        .then(evaluation => {
            // Notify other users
            socket.emit('newEvaluation', {
                topicId: currentTopic._id,
                userId: currentUser._id,
                evaluation
            });
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('evaluationModal'));
            modal.hide();
            
            // Reload evaluations
            loadEvaluations();
        })
        .catch(error => {
            console.error('Error saving evaluation:', error);
            alert('Failed to save evaluation. Please try again.');
        });
}

// Load aggregated scores
function loadAggregatedScores() {
    if (!currentTopic) return;
    
    fetch(`/api/evaluations/aggregated/topic/${currentTopic._id}`)
        .then(response => response.json())
        .then(data => {
            // Display charts
            displayAverageScoresChart(data);
            displayRadarCharts(data);
            displayVarianceChart(data);
        })
        .catch(error => {
            console.error('Error loading aggregated scores:', error);
        });
}

// Display average scores chart
function displayAverageScoresChart(data) {
    const canvas = document.getElementById('avg-scores-chart');
    if (!canvas) return;
    
    const candidateNames = data.map(item => item.candidate.name);
    const averageScores = data.map(item => item.averageScore);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: candidateNames,
            datasets: [{
                label: 'Average Score',
                data: averageScores,
                backgroundColor: 'rgba(13, 110, 253, 0.5)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}

// Display radar charts
function displayRadarCharts(data) {
    const container = document.getElementById('radar-charts');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get unique criteria from the data
    const allCriteria = [];
    data.forEach(item => {
        item.criteriaScores.forEach(cs => {
            if (!allCriteria.find(c => c._id === cs.criterion._id)) {
                allCriteria.push(cs.criterion);
            }
        });
    });
    
    // Create a radar chart for each candidate
    data.forEach(item => {
        const candidateDiv = document.createElement('div');
        candidateDiv.className = 'mb-4';
        
        const candidateTitle = document.createElement('h6');
        candidateTitle.textContent = item.candidate.name;
        
        const canvas = document.createElement('canvas');
        
        candidateDiv.appendChild(candidateTitle);
        candidateDiv.appendChild(canvas);
        container.appendChild(candidateDiv);
        
        // Prepare data for the radar chart
        const labels = allCriteria.map(c => c.name);
        const scores = allCriteria.map(criterion => {
            const criterionScore = item.criteriaScores.find(cs => cs.criterion._id === criterion._id);
            return criterionScore ? criterionScore.averageScore : 0;
        });
        
        new Chart(canvas, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: scores,
                    fill: true,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }
            }
        });
    });
}

// Display variance chart
function displayVarianceChart(data) {
    const canvas = document.getElementById('variance-chart');
    if (!canvas) return;
    
    const candidateNames = data.map(item => item.candidate.name);
    const variances = data.map(item => item.scoreVariance);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: candidateNames,
            datasets: [{
                label: 'Score Variance',
                data: variances,
                backgroundColor: 'rgba(220, 53, 69, 0.5)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load rankings
function loadRankings() {
    if (!currentTopic || !currentUser) return;
    
    fetch(noCacheUrl(`/api/evaluations/rankings/user/${currentUser._id}/topic/${currentTopic._id}`))
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    // No rankings yet, display empty ranking
                    return { rankings: [] };
                }
                throw new Error('Failed to load rankings');
            }
            return response.json();
        })
        .then(data => {
            // Display rankings
            displayCandidateRanking(data.rankings);
        })
        .catch(error => {
            console.error('Error loading rankings:', error);
            // Display empty ranking
            displayCandidateRanking([]);
        });
}

// Display candidate ranking
function displayCandidateRanking(rankings) {
    if (!candidateRanking || !candidates) return;
    
    candidateRanking.innerHTML = '';
    
    // Create array of candidates with rankings
    const rankedCandidates = [];
    
    // Add already ranked candidates
    rankings.forEach(ranking => {
        const candidate = candidates.find(c => c._id === ranking.candidate._id || c._id === ranking.candidate);
        if (candidate) {
            rankedCandidates.push({
                candidate,
                rank: ranking.rank
            });
        }
    });
    
    // Add unranked candidates
    candidates.forEach(candidate => {
        if (!rankedCandidates.find(rc => rc.candidate._id === candidate._id)) {
            rankedCandidates.push({
                candidate,
                rank: rankedCandidates.length + 1
            });
        }
    });
    
    // Sort by rank
    rankedCandidates.sort((a, b) => a.rank - b.rank);
    
    // Create ranking items
    rankedCandidates.forEach((item, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'list-group-item';
        rankingItem.setAttribute('data-id', item.candidate._id);
        
        rankingItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="drag-handle me-3">
                    <i class="bi bi-grip-vertical"></i>
                    <span class="badge bg-secondary">${index + 1}</span>
                </div>
                <div>
                    <h6 class="mb-0">${item.candidate.name}</h6>
                    <p class="mb-0 small text-muted">${item.candidate.description || 'No description'}</p>
                </div>
            </div>
        `;
        
        candidateRanking.appendChild(rankingItem);
    });
    
    // Make ranking sortable
    if (typeof Sortable !== 'undefined') {
        Sortable.create(candidateRanking, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: function() {
                // Update ranking numbers
                const items = candidateRanking.querySelectorAll('.list-group-item');
                items.forEach((item, index) => {
                    const badge = item.querySelector('.badge');
                    if (badge) {
                        badge.textContent = index + 1;
                    }
                });
            }
        });
    }
}

// Save rankings
function saveRankings() {
    if (!candidateRanking || !currentTopic || !currentUser) return;
    
    const items = candidateRanking.querySelectorAll('.list-group-item');
    const rankings = [];
    
    items.forEach((item, index) => {
        rankings.push({
            candidateId: item.getAttribute('data-id'),
            rank: index + 1
        });
    });
    
    fetch('/api/evaluations/rankings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUser._id,
            topicId: currentTopic._id,
            rankings
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save rankings');
            }
            return response.json();
        })
        .then(() => {
            alert('Rankings saved successfully');
            
            // Reload discrepancies
            loadDiscrepancies();
        })
        .catch(error => {
            console.error('Error saving rankings:', error);
            alert('Failed to save rankings. Please try again.');
        });
}

// Load discrepancies
function loadDiscrepancies() {
    if (!currentTopic) return;
    
    fetch(`/api/evaluations/discrepancies/topic/${currentTopic._id}`)
        .then(response => response.json())
        .then(data => {
            displayDiscrepancies(data);
        })
        .catch(error => {
            console.error('Error loading discrepancies:', error);
        });
}

// Display discrepancies
function displayDiscrepancies(discrepancies) {
    if (!discrepanciesList) return;
    
    discrepanciesList.innerHTML = '';
    
    if (discrepancies.length === 0) {
        discrepanciesList.innerHTML = `
            <div class="alert alert-info">
                No significant discrepancies found.
            </div>
        `;
        return;
    }
    
    discrepancies.forEach(userDiscrepancy => {
        const discrepancyItem = document.createElement('div');
        discrepancyItem.className = 'discrepancy-item';
        
        let discrepanciesHTML = '';
        userDiscrepancy.discrepancies.forEach(d => {
            const higherRankedCandidate = candidates.find(c => c._id === d.higherRankedCandidate);
            const lowerRankedCandidate = candidates.find(c => c._id === d.lowerRankedCandidate);
            
            if (higherRankedCandidate && lowerRankedCandidate) {
                discrepanciesHTML += `
                    <div class="mb-2">
                        <p class="mb-1">
                            <strong>${lowerRankedCandidate.name}</strong> scored higher (by ${d.scoreDifference.toFixed(1)} points) than 
                            <strong>${higherRankedCandidate.name}</strong> but was ranked lower.
                        </p>
                    </div>
                `;
            }
        });
        
        discrepancyItem.innerHTML = `
            <h6>${userDiscrepancy.user.name}'s Rankings</h6>
            ${discrepanciesHTML}
        `;
        
        discrepanciesList.appendChild(discrepancyItem);
    });
}

// Load suggested criteria
function loadSuggestedCriteria() {
    if (!currentTopic) return;
    
    // In a real app, this would be an API call
    // For this proof of concept, we'll use dummy data
    const dummySuggestions = [
        {
            name: 'Cost efficiency',
            description: 'How cost-efficient is this option in the long term',
            reason: 'Candidates with good long-term value are ranked highly despite lower scores on immediate cost'
        },
        {
            name: 'Team preference',
            description: 'Overall team preference based on informal feedback',
            reason: 'There are consistent ranking discrepancies that suggest unstated preferences'
        },
        {
            name: 'Implementation complexity',
            description: 'How complex would implementation be',
            reason: 'Candidates with simpler implementation are ranked higher despite lower feature scores'
        }
    ];
    
    displaySuggestedCriteria(dummySuggestions);
}

// Display suggested criteria
function displaySuggestedCriteria(suggestions) {
    if (!suggestedCriteriaList) return;
    
    suggestedCriteriaList.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestedCriteriaList.innerHTML = `
            <div class="alert alert-info">
                No criteria suggestions available.
            </div>
        `;
        return;
    }
    
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggested-criterion';
        
        suggestionItem.innerHTML = `
            <h6>${suggestion.name}</h6>
            <p class="mb-1">${suggestion.description}</p>
            <p class="mb-0 small text-muted">
                <strong>Why suggested:</strong> ${suggestion.reason}
            </p>
            <button class="btn btn-sm btn-outline-primary mt-2 add-suggested-criterion" 
                    data-name="${suggestion.name}" 
                    data-description="${suggestion.description}">
                Add This Criterion
            </button>
        `;
        
        suggestedCriteriaList.appendChild(suggestionItem);
    });
    
    // Add event listeners for the "Add" buttons
    document.querySelectorAll('.add-suggested-criterion').forEach(button => {
        button.addEventListener('click', () => {
            const name = button.getAttribute('data-name');
            const description = button.getAttribute('data-description');
            
            createNewCriterion(name, description, true);
        });
    });
}

// Invite a participant
function inviteParticipant(email) {
    if (!currentTopic) return;
    
    // In a real app, this would send an invitation email
    // For this proof of concept, we'll just create or find a user and add them to the topic
    
    // Check if user exists
    fetch(`/api/users?email=${email}`)
        .then(response => response.json())
        .then(users => {
            let userId;
            
            if (users.length > 0) {
                // User exists
                userId = users[0]._id;
            } else {
                // Create a new user
                return fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: email.split('@')[0], // Use part of email as name
                        email
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to create user');
                        }
                        return response.json();
                    })
                    .then(user => user._id);
            }
            
            return userId;
        })
        .then(userId => {
            // Add user to topic
            return fetch(`/api/topics/${currentTopic._id}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add participant');
            }
            return response.json();
        })
        .then(() => {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('inviteModal'));
            modal.hide();
            
            // Clear the form
            inviteForm.reset();
            
            // Reload participants
            loadParticipants();
            
            alert(`Invitation sent to ${email}`);
        })
        .catch(error => {
            console.error('Error inviting participant:', error);
            alert('Failed to invite participant. Please try again.');
        });
}

// Advance to the next phase
function advanceToNextPhase() {
    if (!currentTopic) return;
    
    const nextPhase = currentTopic.currentPhase + 1;
    
    if (nextPhase > 3) {
        alert('Already in the final phase');
        return;
    }
    
    fetch(noCacheUrl(`/api/topics/${currentTopic._id}/phase`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ phase: nextPhase })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to advance phase');
            }
            return response.json();
        })
        .then(topic => {
            currentTopic = topic;
            
            // Update phase display
            updatePhaseDisplay();
            
            // Load data for the new phase
            loadPhaseData();
        })
        .catch(error => {
            console.error('Error advancing phase:', error);
            alert('Failed to advance to next phase. Please try again.');
        });
}

// Go to the previous phase
function goToPreviousPhase() {
    if (!currentTopic) return;
    
    const prevPhase = currentTopic.currentPhase - 1;
    
    if (prevPhase < 1) {
        alert('Already in the first phase');
        return;
    }
    
    fetch(noCacheUrl(`/api/topics/${currentTopic._id}/phase`), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ phase: prevPhase })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to go back to previous phase');
            }
            return response.json();
        })
        .then(topic => {
            currentTopic = topic;
            
            // Update phase display
            updatePhaseDisplay();
            
            // Load data for the new phase
            loadPhaseData();
        })
        .catch(error => {
            console.error('Error going back to previous phase:', error);
            alert('Failed to go back to previous phase. Please try again.');
        });
}
