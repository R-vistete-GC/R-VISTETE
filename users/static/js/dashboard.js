// Obtener datos de sentimientos
const sentimientosData = JSON.parse(document.getElementById('sentimientosData').textContent);
const recomendacionesData = JSON.parse(document.getElementById('recomendacionesData').textContent);

// Gráfica de sentimientos
const sentimientosCtx = document.getElementById('sentimientosChart').getContext('2d');
const sentimientosChart = new Chart(sentimientosCtx, {
    type: 'doughnut',
    data: {
        labels: ['Positivos', 'Neutros', 'Negativos'],
        datasets: [{
            data: [sentimientosData.positivos, sentimientosData.neutros, sentimientosData.negativos],
            backgroundColor: ['#4caf50', '#ffc107', '#f44336']
        }]
    }
});

// Gráfica de estilos preferidos
const estilosCtx = document.getElementById('estilosChart').getContext('2d');
const estilosChart = new Chart(estilosCtx, {
    type: 'bar',
    data: {
        labels: ['Casual', 'Elegante', 'Deportivo'],
        datasets: [{
            data: JSON.parse(document.getElementById('estilosData').textContent),
            backgroundColor: ['#2196f3', '#9c27b0', '#ff9800']
        }]
    }
});

// Gráfica de recomendaciones
const recomendacionesCtx = document.getElementById('recomendacionesChart').getContext('2d');
const recomendacionesChart = new Chart(recomendacionesCtx, {
    type: 'bar',
    data: {
        labels: recomendacionesData.map(rec => rec.publicacion.titulo),
        datasets: [{
            label: 'Puntuación',
            data: recomendacionesData.map(rec => rec.puntuacion),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});