// Global variables
let currentUser = null;
const socket = io();

// DOM elements
const topicsList = document.getElementById('topics-list');
const newTopicForm = document.getElementById('new-topic-form');
const activityChart = document.getElementById('activity-chart');
const recentUpdates = document.getElementById('recent-updates');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        loadDashboard();
    } else {
        // Redirect to home if not logged in
        window.location.href = '/';
    }
    
    // New topic form submission
    if (newTopicForm) {
        newTopicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('topic-name').value;
            const description = document.getElementById('topic-description').value;
            
            createNewTopic(name, description);
        });
    }
});

// Load dashboard data
function loadDashboard() {
    if (!currentUser) return;
    
    console.log('Loading dashboard for user:', currentUser);
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Load user's topics
    fetch(`/api/users/${currentUser._id}/topics?_nocache=${timestamp}`)
        .then(response => {
            console.log('Topics response:', response);
            return response.json();
        })
        .then(topics => {
            console.log('Topics loaded:', topics);
            displayTopics(topics);
        })
        .catch(error => {
            console.error('Error loading topics:', error);
        });
    
    // Create activity chart
    createActivityChart();
    
    // Load recent updates
    loadRecentUpdates();
}

// Display topics in the list
function displayTopics(topics) {
    if (!topicsList) return;
    
    console.log('Displaying topics:', topics);
    topicsList.innerHTML = '';
    
    if (!topics || topics.length === 0) {
        console.log('No topics to display');
        topicsList.innerHTML = `
            <div class="list-group-item">
                <p class="mb-0">You don't have any topics yet. Create one to get started!</p>
            </div>
        `;
        return;
    }
    
    topics.forEach(topic => {
        console.log('Processing topic:', topic);
        // Create badge for current phase
        let phaseBadge = '';
        if (topic.currentPhase === 1) {
            phaseBadge = '<span class="badge bg-primary ms-2">Definition</span>';
        } else if (topic.currentPhase === 2) {
            phaseBadge = '<span class="badge bg-info ms-2">Collection</span>';
        } else if (topic.currentPhase === 3) {
            phaseBadge = '<span class="badge bg-success ms-2">Decision</span>';
        }
        
        const topicItem = document.createElement('a');
        topicItem.href = `/topics/${topic._id}`;
        topicItem.className = 'list-group-item list-group-item-action';
        topicItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${topic.name} ${phaseBadge}</h5>
                <small>${formatDate(topic.createdAt)}</small>
            </div>
            <p class="mb-1">${topic.description || 'No description'}</p>
            <small>${topic.participants ? topic.participants.length : 0} participants</small>
        `;
        
        topicsList.appendChild(topicItem);
    });
}

// Create a new topic
function createNewTopic(name, description) {
    fetch('/api/topics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            userId: currentUser._id
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create topic');
            }
            return response.json();
        })
        .then(topic => {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTopicModal'));
            modal.hide();
            
            // Clear the form
            newTopicForm.reset();
            
            // Reload the dashboard
            loadDashboard();
        })
        .catch(error => {
            console.error('Error creating topic:', error);
            alert('Failed to create topic. Please try again.');
        });
}

// Create activity chart
function createActivityChart() {
    if (!activityChart) return;
    
    // In a real app, this would fetch data from the API
    // For now, we'll use dummy data
    
    // Get the last 7 days
    const days = [];
    const date = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(date);
        d.setDate(date.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    // Create random data for the chart
    const data = {
        labels: days,
        datasets: [
            {
                label: 'Criteria Added',
                data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
                backgroundColor: 'rgba(13, 110, 253, 0.5)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
            },
            {
                label: 'Evaluations Made',
                data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)),
                backgroundColor: 'rgba(25, 135, 84, 0.5)',
                borderColor: 'rgba(25, 135, 84, 1)',
                borderWidth: 1
            }
        ]
    };
    
    new Chart(activityChart, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Your Activity'
                }
            }
        }
    });
}

// Load recent updates
function loadRecentUpdates() {
    if (!recentUpdates) return;
    
    // In a real app, this would fetch data from the API
    // For now, we'll use dummy data
    const dummyUpdates = [
        {
            type: 'criterion',
            action: 'added',
            name: 'Cost Efficiency',
            topic: 'Software Vendor Selection',
            time: new Date(Date.now() - 30 * 60000) // 30 minutes ago
        },
        {
            type: 'evaluation',
            action: 'submitted',
            candidate: 'CloudCRM Solutions',
            criterion: 'User Experience',
            topic: 'Software Vendor Selection',
            time: new Date(Date.now() - 3 * 3600000) // 3 hours ago
        },
        {
            type: 'topic',
            action: 'phase-change',
            topic: 'New Office Location',
            phase: 2,
            time: new Date(Date.now() - 1 * 86400000) // 1 day ago
        },
        {
            type: 'candidate',
            action: 'added',
            name: 'Downtown Office Tower',
            topic: 'New Office Location',
            time: new Date(Date.now() - 2 * 86400000) // 2 days ago
        }
    ];
    
    recentUpdates.innerHTML = '';
    
    dummyUpdates.forEach(update => {
        const updateItem = document.createElement('div');
        updateItem.className = 'list-group-item';
        
        let content = '';
        
        if (update.type === 'criterion') {
            content = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">New criterion: "${update.name}"</h6>
                    <small>${formatTime(update.time)}</small>
                </div>
                <p class="mb-1">Added to ${update.topic}</p>
            `;
        } else if (update.type === 'evaluation') {
            content = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">Evaluated: ${update.candidate}</h6>
                    <small>${formatTime(update.time)}</small>
                </div>
                <p class="mb-1">Criterion: ${update.criterion} in ${update.topic}</p>
            `;
        } else if (update.type === 'topic') {
            const phases = ['Definition', 'Collection', 'Decision'];
            content = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${update.topic} advanced to Phase ${update.phase}</h6>
                    <small>${formatTime(update.time)}</small>
                </div>
                <p class="mb-1">Now in ${phases[update.phase - 1]} phase</p>
            `;
        } else if (update.type === 'candidate') {
            content = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">New candidate: "${update.name}"</h6>
                    <small>${formatTime(update.time)}</small>
                </div>
                <p class="mb-1">Added to ${update.topic}</p>
            `;
        }
        
        updateItem.innerHTML = content;
        recentUpdates.appendChild(updateItem);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format relative time
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else if (diffHour > 0) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMin > 0) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else {
        return 'Just now';
    }
}
