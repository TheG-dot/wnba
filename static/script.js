document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const homeSelect = document.getElementById('home-team');
    const awaySelect = document.getElementById('away-team');
    const predictBtn = document.getElementById('predict-btn');
    const resultCard = document.getElementById('prediction-result');
    const winnerText = document.getElementById('winner-text');
    const marginValue = document.getElementById('margin-value');
    const restInfo = document.getElementById('rest-info');
    
    const rmseVal = document.getElementById('rmse-val');
    const maeVal = document.getElementById('mae-val');
    
    // Load Live Dashboard
    fetch('/api/live')
        .then(response => response.json())
        .then(data => {
            const gamesContainer = document.getElementById('live-games-container');
            data.games.forEach(game => {
                const card = document.createElement('div');
                card.className = 'live-card';
                card.innerHTML = `
                    <div class="live-info">
                        <h4>${game.matchup}</h4>
                        <p>Prediction: ${game.predicted_winner}</p>
                    </div>
                    <div class="live-result">
                        +${game.margin}
                    </div>
                `;
                gamesContainer.appendChild(card);
            });
            
            const propsContainer = document.getElementById('live-props-container');
            data.best_bets.forEach(bet => {
                const card = document.createElement('div');
                card.className = 'live-card prop';
                const isOver = bet.recommendation === "OVER";
                card.innerHTML = `
                    <div class="live-info">
                        <h4>${bet.player}</h4>
                        <p>${bet.prop_type} Line: ${bet.line}</p>
                    </div>
                    <div class="live-result ${isOver ? 'over' : 'under'}">
                        Proj: ${bet.projection}<br>
                        ${bet.recommendation}
                    </div>
                `;
                propsContainer.appendChild(card);
            });
        })
        .catch(err => console.error("Error loading live data:", err));
        
    // Load Teams
    fetch('/api/teams')
        .then(response => response.json())
        .then(teams => {
            teams.forEach(team => {
                const opt1 = document.createElement('option');
                opt1.value = team;
                opt1.textContent = team;
                homeSelect.appendChild(opt1);
                
                const opt2 = document.createElement('option');
                opt2.value = team;
                opt2.textContent = team;
                awaySelect.appendChild(opt2);
            });
        })
        .catch(err => console.error("Error loading teams:", err));
        
    // Load Stats and Render Chart
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            // Update Metrics
            rmseVal.textContent = data.rmse.toFixed(2);
            maeVal.textContent = data.mae.toFixed(2);
            
            // Render Chart.js
            const ctx = document.getElementById('importanceChart').getContext('2d');
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 400, 0);
            gradient.addColorStop(0, 'rgba(255, 87, 34, 0.8)');
            gradient.addColorStop(1, 'rgba(156, 39, 176, 0.8)');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.feature_labels,
                    datasets: [{
                        label: 'Relative Importance',
                        data: data.feature_values,
                        backgroundColor: gradient,
                        borderRadius: 6,
                        borderWidth: 0,
                    }]
                },
                options: {
                    indexAxis: 'y', // Horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { family: 'Outfit', size: 14 },
                            bodyFont: { family: 'Outfit', size: 14 },
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: { color: '#94a3b8', font: {family: 'Outfit'} }
                        },
                        y: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: { color: '#ffffff', font: {family: 'Outfit', size: 12} }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    }
                }
            });
        })
        .catch(err => console.error("Error loading stats:", err));
        
    // Predict Action
    predictBtn.addEventListener('click', () => {
        const home = homeSelect.value;
        const away = awaySelect.value;
        
        if(!home || !away) {
            alert("Please select both a Home and Away team.");
            return;
        }
        
        if(home === away) {
            alert("Home and Away teams must be different.");
            return;
        }
        
        predictBtn.textContent = "Analyzing...";
        predictBtn.disabled = true;
        
        fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ home, away })
        })
        .then(response => response.json())
        .then(data => {
            predictBtn.textContent = "Predict Spread";
            predictBtn.disabled = false;
            
            if(data.error) {
                alert("Error: " + data.error);
                return;
            }
            
            // Show result
            winnerText.textContent = `${data.predicted_winner} to Win/Cover`;
            winnerText.style.color = data.predicted_winner === home ? 'var(--accent-orange)' : 'var(--accent-purple)';
            marginValue.textContent = data.margin;
            
            restInfo.innerHTML = `Based on latest stats.<br>${home} Rest: ${data.home_rest} days | ${away} Rest: ${data.away_rest} days`;
            
            resultCard.style.display = 'block';
            // Trigger reflow
            void resultCard.offsetWidth;
            resultCard.style.opacity = '1';
        })
        .catch(err => {
            console.error("Prediction error:", err);
            predictBtn.textContent = "Predict Spread";
            predictBtn.disabled = false;
            alert("An error occurred during prediction.");
        });
    });
});
