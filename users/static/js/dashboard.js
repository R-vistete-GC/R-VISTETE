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

// Gráfica de distribución de estilos
const estilosDistribucionCtx = document.getElementById('estilosDistribucionChart').getContext('2d');
new Chart(estilosDistribucionCtx, {
    type: 'pie',
    data: {
        labels: Object.keys(estilosDistribucionData),
        datasets: [{
            data: Object.values(estilosDistribucionData),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'],
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
    }
});

// Gráfica de distribución de colores
const coloresDistribucionCtx = document.getElementById('coloresDistribucionChart').getContext('2d');
new Chart(coloresDistribucionCtx, {
    type: 'bar',
    data: {
        labels: Object.keys(coloresDistribucionData),
        datasets: [{
            label: 'Colores',
            data: Object.values(coloresDistribucionData),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'],
            borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'],
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

// Gráfica de recomendaciones
if (recomendacionesData.length === 0) {
    console.warn('No hay datos de recomendaciones para mostrar.');
} else {
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
}

document.addEventListener('DOMContentLoaded', function () {
    // Función para actualizar estadísticas en tiempo real
    const actualizarEstadisticas = () => {
        fetch('/users/dashboard/data/') // Ruta para obtener datos en tiempo real
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener datos de la API');
                }
                return response.json();
            })
            .then(data => {
                // Actualizar los valores en el DOM
                document.querySelector('#totalLikes').textContent = data.total_likes;
                document.querySelector('#totalFavoritos').textContent = data.total_favoritos;
                document.querySelector('#totalCompras').textContent = data.total_compras;
                document.querySelector('#totalAlquileres').textContent = data.total_alquileres;
                document.querySelector('#totalRecomendaciones').textContent = data.total_recomendaciones;
            })
            .catch(error => console.error('Error al actualizar estadísticas:', error));
    };

    // Llamar a la función cada 30 segundos
    setInterval(actualizarEstadisticas, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarEstadisticas();
});